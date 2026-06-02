<?php

namespace App\Jobs;

use Throwable;
use Illuminate\Http\File;
use Illuminate\Bus\Queueable;
use App\Helpers\StorageHelper;
use App\Models\Account\ExportJob;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Contracts\Queue\ShouldQueue;
use App\Notifications\ExportAccountDone;
use Illuminate\Foundation\Bus\Dispatchable;
use App\Services\Account\Settings\SqlExportAccount;
use App\Services\Account\Settings\JsonExportAccount;

class ExportAccount implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * @var string
     */
    protected $path = '';

    /**
     * Export job.
     *
     * @var ExportJob
     */
    protected $exportJob;

    /**
     * Create a new job instance.
     *
     * @param  ExportJob  $exportJob
     * @param  string|null  $path
     */
    public function __construct(ExportJob $exportJob, ?string $path = null)
    {
        $exportJob->status = ExportJob::EXPORT_TODO;
        $exportJob->save();
        $this->exportJob = $exportJob->withoutRelations();
        $this->path = $path ?? 'exports';
    }

    /**
     * Execute the job.
     */
    public function handle()
    {
        $this->exportJob->start();

        $tempFileName = '';
        $handler = $this->exportJob->type === ExportJob::JSON ?
            app(JsonExportAccount::class) :
            app(SqlExportAccount::class);
        try {
            $tempFileName = $handler->execute([
                'account_id' => $this->exportJob->account_id,
                'user_id' => $this->exportJob->user_id,
            ]);

            // get the temp file that we just created
            $tempFilePath = StorageHelper::disk('local')->path($tempFileName);

            // move the file to the public storage
            $file = StorageHelper::disk(config('filesystems.default'))
                ->putFileAs($this->path, new File($tempFilePath), basename($tempFileName));

            $this->exportJob->location = config('filesystems.default');
            $this->exportJob->filename = $file;

            $this->exportJob->end();
        } catch (Throwable $e) {
            $this->fail($e);

            return;
        } finally {
            // delete old file from temp folder
            $storage = Storage::disk('local');
            if ($storage->exists($tempFileName)) {
                $storage->delete($tempFileName);
            }
        }

        // The export is committed (status=done, file on disk) before the
        // user-facing notification is dispatched. A notification failure
        // (mail misconfig, SMTP outage, …) is logged but does NOT roll the
        // status back — the artifact stays recoverable from the exports
        // list. With QUEUE_CONNECTION=sync (Monica's default) the notify
        // call runs inline, so the catch is what protects status from a
        // synchronous throw; on a real queue driver the notification is
        // already isolated and this catch is a no-op. See #738.
        try {
            $this->exportJob->user->notify(new ExportAccountDone($this->exportJob));
        } catch (Throwable $e) {
            Log::warning('Export notification dispatch failed', [
                'export_job_id' => $this->exportJob->id,
                'exception' => $e->getMessage(),
            ]);
        }
    }

    /**
     * Handle a job failure.
     *
     * @param  \Throwable  $exception
     */
    public function failed(Throwable $exception): void
    {
        $this->exportJob->status = ExportJob::EXPORT_FAILED;
        $this->exportJob->save();
    }
}
