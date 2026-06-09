<?php

namespace App\Http\Controllers\Auth;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Route;

class Validate2faController extends Controller
{
    /**
     * Redirect the user after 2fa form has been submitted.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Symfony\Component\HttpFoundation\Response|\Illuminate\Http\RedirectResponse|\Illuminate\Routing\Redirector|\Illuminate\Http\JsonResponse|\Illuminate\Http\Response
     */
    public function index(Request $request)
    {
        if ($request->session()->get('oauth')) {
            return Route::respondWithRoute('oauth.verify');
        }
        if ($request->has('url')) {
            return redirect(urldecode($request->input('url')));
        }

        return redirect()->route('login');
    }
}
