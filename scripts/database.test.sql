
/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accounts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `has_access_to_paid_version_for_free` tinyint(1) NOT NULL DEFAULT '0',
  `api_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number_of_invitations_sent` int DEFAULT NULL,
  `default_time_reminder_is_sent` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '12:00',
  `default_gender_id` int unsigned DEFAULT NULL,
  `stripe_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pm_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pm_last_four` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `legacy_free_plan_unlimited_contacts` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `accounts_default_gender_id_foreign` (`default_gender_id`),
  KEY `accounts_stripe_id_index` (`stripe_id`),
  KEY `accounts_uuid_index` (`uuid`),
  CONSTRAINT `accounts_default_gender_id_foreign` FOREIGN KEY (`default_gender_id`) REFERENCES `genders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activities` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `activity_type_id` int unsigned DEFAULT NULL,
  `summary` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `happened_at` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activities_activity_type_id_foreign` (`activity_type_id`),
  KEY `activities_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `activities_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activities_activity_type_id_foreign` FOREIGN KEY (`activity_type_id`) REFERENCES `activity_types` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_contact` (
  `activity_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `account_id` int unsigned NOT NULL,
  KEY `activity_contact_activity_id_foreign` (`activity_id`),
  KEY `activity_contact_contact_id_foreign` (`contact_id`),
  KEY `activity_contact_account_id_foreign` (`account_id`),
  CONSTRAINT `activity_contact_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_contact_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_contact_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_statistics` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `year` int NOT NULL,
  `count` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_statistics_account_id_foreign` (`account_id`),
  KEY `activity_statistics_contact_id_foreign` (`contact_id`),
  CONSTRAINT `activity_statistics_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_statistics_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_type_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_type_categories_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `activity_type_categories_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `activity_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `activity_type_category_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `activity_types_activity_type_category_id_foreign` (`activity_type_category_id`),
  KEY `activity_types_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `activity_types_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `activity_types_activity_type_category_id_foreign` FOREIGN KEY (`activity_type_category_id`) REFERENCES `activity_type_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `address_contact_field_label` (
  `contact_field_label_id` bigint unsigned NOT NULL,
  `address_id` int unsigned NOT NULL,
  `account_id` int unsigned NOT NULL,
  KEY `address_contact_field_label_index` (`contact_field_label_id`,`address_id`,`account_id`),
  KEY `address_contact_field_label_address_id_foreign` (`address_id`),
  KEY `address_contact_field_label_account_id_foreign` (`account_id`),
  CONSTRAINT `address_contact_field_label_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `address_contact_field_label_address_id_foreign` FOREIGN KEY (`address_id`) REFERENCES `addresses` (`id`) ON DELETE CASCADE,
  CONSTRAINT `address_contact_field_label_contact_field_label_id_foreign` FOREIGN KEY (`contact_field_label_id`) REFERENCES `contact_field_labels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addressbook_subscriptions` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `address_book_id` bigint unsigned NOT NULL,
  `name` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL,
  `uri` varchar(2096) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(1024) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `readonly` tinyint(1) NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `capabilities` varchar(2048) COLLATE utf8mb4_unicode_ci NOT NULL,
  `syncToken` varchar(512) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `localSyncToken` varchar(1024) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `frequency` smallint NOT NULL DEFAULT '180',
  `last_synchronized_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbook_subscriptions_user_id_foreign` (`user_id`),
  KEY `addressbook_subscriptions_address_book_id_foreign` (`address_book_id`),
  KEY `addressbook_subscriptions_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `addressbook_subscriptions_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addressbook_subscriptions_address_book_id_foreign` FOREIGN KEY (`address_book_id`) REFERENCES `addressbooks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addressbook_subscriptions_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addressbooks` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `description` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addressbooks_name_index` (`name`),
  KEY `addressbooks_user_id_foreign` (`user_id`),
  KEY `addressbooks_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `addressbooks_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addressbooks_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `addresses` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `place_id` int unsigned DEFAULT NULL,
  `contact_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `addresses_contact_id_foreign` (`contact_id`),
  KEY `addresses_place_id_foreign` (`place_id`),
  KEY `addresses_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `addresses_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addresses_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `addresses_place_id_foreign` FOREIGN KEY (`place_id`) REFERENCES `places` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `api_usage` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `url` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `method` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `client_ip` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `audit_logs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `author_id` int unsigned DEFAULT NULL,
  `about_contact_id` int unsigned DEFAULT NULL,
  `author_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `action` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `objects` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `audited_at` datetime NOT NULL,
  `should_appear_on_dashboard` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `audit_logs_account_id_foreign` (`account_id`),
  KEY `audit_logs_author_id_foreign` (`author_id`),
  KEY `audit_logs_about_contact_id_foreign` (`about_contact_id`),
  CONSTRAINT `audit_logs_about_contact_id_foreign` FOREIGN KEY (`about_contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL,
  CONSTRAINT `audit_logs_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `audit_logs_author_id_foreign` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cache` (
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `value` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `expiration` int NOT NULL,
  UNIQUE KEY `cache_key_unique` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calls` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `called_at` datetime NOT NULL,
  `content` mediumtext COLLATE utf8mb4_unicode_ci,
  `contact_called` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `calls_contact_id_foreign` (`contact_id`),
  KEY `calls_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `calls_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `calls_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `website` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number_of_employees` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `companies_account_id_foreign` (`account_id`),
  CONSTRAINT `companies_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_field_contact_field_label` (
  `contact_field_label_id` bigint unsigned NOT NULL,
  `contact_field_id` int unsigned NOT NULL,
  `account_id` int unsigned NOT NULL,
  KEY `contact_field_contact_field_label_index` (`contact_field_label_id`,`contact_field_id`,`account_id`),
  KEY `contact_field_contact_field_label_contact_field_id_foreign` (`contact_field_id`),
  KEY `contact_field_contact_field_label_account_id_foreign` (`account_id`),
  CONSTRAINT `contact_field_contact_field_label_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_field_contact_field_label_contact_field_id_foreign` FOREIGN KEY (`contact_field_id`) REFERENCES `contact_fields` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_field_contact_field_label_contact_field_label_id_foreign` FOREIGN KEY (`contact_field_label_id`) REFERENCES `contact_field_labels` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_field_labels` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `label_i18n` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `label` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_field_labels_label_i18n_account_id_index` (`label_i18n`,`account_id`),
  KEY `contact_field_labels_label_account_id_index` (`label`,`account_id`),
  KEY `contact_field_labels_account_id_foreign` (`account_id`),
  CONSTRAINT `contact_field_labels_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_field_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fontawesome_icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_field_types_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `contact_field_types_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_fields` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `contact_field_type_id` int unsigned NOT NULL,
  `data` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `contact_fields_contact_id_foreign` (`contact_id`),
  KEY `contact_fields_contact_field_type_id_foreign` (`contact_field_type_id`),
  KEY `contact_fields_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `contact_fields_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_fields_contact_field_type_id_foreign` FOREIGN KEY (`contact_field_type_id`) REFERENCES `contact_field_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_fields_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_photo` (
  `contact_id` int unsigned NOT NULL,
  `photo_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `contact_photo_photo_id_foreign` (`photo_id`),
  KEY `contact_photo_contact_id_foreign` (`contact_id`),
  CONSTRAINT `contact_photo_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_photo_photo_id_foreign` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contact_tag` (
  `contact_id` int unsigned NOT NULL,
  `tag_id` int unsigned NOT NULL,
  `account_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `contact_tag_account_id_foreign` (`account_id`),
  KEY `contact_tag_contact_id_foreign` (`contact_id`),
  KEY `contact_tag_tag_id_foreign` (`tag_id`),
  CONSTRAINT `contact_tag_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_tag_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contact_tag_tag_id_foreign` FOREIGN KEY (`tag_id`) REFERENCES `tags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contacts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `address_book_id` bigint unsigned DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `middle_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nickname` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `gender_id` int DEFAULT NULL,
  `description` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_starred` tinyint(1) NOT NULL DEFAULT '0',
  `is_partial` tinyint(1) NOT NULL DEFAULT '0',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `is_dead` tinyint(1) NOT NULL DEFAULT '0',
  `deceased_special_date_id` int unsigned DEFAULT NULL,
  `deceased_reminder_id` int unsigned DEFAULT NULL,
  `last_talked_to` date DEFAULT NULL,
  `stay_in_touch_frequency` int DEFAULT NULL,
  `stay_in_touch_trigger_date` datetime DEFAULT NULL,
  `birthday_special_date_id` int unsigned DEFAULT NULL,
  `birthday_reminder_id` int unsigned DEFAULT NULL,
  `first_met_through_contact_id` int DEFAULT NULL,
  `first_met_special_date_id` int unsigned DEFAULT NULL,
  `first_met_reminder_id` int unsigned DEFAULT NULL,
  `first_met_where` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_met_additional_info` longtext COLLATE utf8mb4_unicode_ci,
  `job` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `company` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `food_preferences` longtext COLLATE utf8mb4_unicode_ci,
  `avatar_source` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'default',
  `avatar_gravatar_url` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_default_url` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_photo_id` int unsigned DEFAULT NULL,
  `has_avatar` tinyint(1) NOT NULL DEFAULT '0',
  `avatar_external_url` varchar(400) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_file_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `avatar_location` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'local',
  `gravatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `vcard` mediumtext COLLATE utf8mb4_unicode_ci,
  `distant_etag` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `last_consulted_at` timestamp NULL DEFAULT NULL,
  `number_of_views` int NOT NULL DEFAULT '0',
  `deleted_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `default_avatar_color` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `has_avatar_bool` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `contacts_birthday_reminder_id_foreign` (`birthday_reminder_id`),
  KEY `contacts_first_met_reminder_id_foreign` (`first_met_reminder_id`),
  KEY `contacts_deceased_reminder_id_foreign` (`deceased_reminder_id`),
  KEY `contacts_birthday_special_date_id_foreign` (`birthday_special_date_id`),
  KEY `contacts_first_met_special_date_id_foreign` (`first_met_special_date_id`),
  KEY `contacts_deceased_special_date_id_foreign` (`deceased_special_date_id`),
  KEY `contacts_account_id_uuid_index` (`account_id`,`uuid`),
  KEY `contacts_avatar_photo_id_foreign` (`avatar_photo_id`),
  KEY `contacts_address_book_id_foreign` (`address_book_id`),
  CONSTRAINT `contacts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contacts_address_book_id_foreign` FOREIGN KEY (`address_book_id`) REFERENCES `addressbooks` (`id`) ON DELETE CASCADE,
  CONSTRAINT `contacts_avatar_photo_id_foreign` FOREIGN KEY (`avatar_photo_id`) REFERENCES `photos` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_birthday_reminder_id_foreign` FOREIGN KEY (`birthday_reminder_id`) REFERENCES `reminders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_birthday_special_date_id_foreign` FOREIGN KEY (`birthday_special_date_id`) REFERENCES `special_dates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_deceased_reminder_id_foreign` FOREIGN KEY (`deceased_reminder_id`) REFERENCES `reminders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_deceased_special_date_id_foreign` FOREIGN KEY (`deceased_special_date_id`) REFERENCES `special_dates` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_first_met_reminder_id_foreign` FOREIGN KEY (`first_met_reminder_id`) REFERENCES `reminders` (`id`) ON DELETE SET NULL,
  CONSTRAINT `contacts_first_met_special_date_id_foreign` FOREIGN KEY (`first_met_special_date_id`) REFERENCES `special_dates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `conversations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `contact_field_type_id` int unsigned NOT NULL,
  `happened_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `conversations_contact_id_foreign` (`contact_id`),
  KEY `conversations_contact_field_type_id_foreign` (`contact_field_type_id`),
  KEY `conversations_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `conversations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_contact_field_type_id_foreign` FOREIGN KEY (`contact_field_type_id`) REFERENCES `contact_field_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversations_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `crons` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `command` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_run` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `crons_command_unique` (`command`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `currencies` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `iso` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `symbol` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=154 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `days` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `date` date NOT NULL,
  `rate` int NOT NULL,
  `comment` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `days_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `days_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `debts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `in_debt` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'no',
  `status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'inprogress',
  `amount` int NOT NULL,
  `currency_id` int unsigned DEFAULT NULL,
  `reason` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `debts_contact_id_foreign` (`contact_id`),
  KEY `debts_currency_id_foreign` (`currency_id`),
  KEY `debts_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `debts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `debts_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `debts_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_activity_type_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_activity_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `default_activity_type_category_id` int NOT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `location_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_contact_field_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `fontawesome_icon` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `protocol` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `delible` tinyint(1) NOT NULL DEFAULT '1',
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_contact_modules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_life_event_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_life_event_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `default_life_event_category_id` int unsigned NOT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `specific_information_structure` text COLLATE utf8mb4_unicode_ci,
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `default_life_event_types_default_life_event_category_id_foreign` (`default_life_event_category_id`),
  CONSTRAINT `default_life_event_types_default_life_event_category_id_foreign` FOREIGN KEY (`default_life_event_category_id`) REFERENCES `default_life_event_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=44 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_relationship_type_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `default_relationship_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_reverse_relationship` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship_type_group_id` int NOT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `migrated` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `default_relationship_types_migrated_index` (`migrated`)
) ENGINE=InnoDB AUTO_INCREMENT=28 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `documents` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize` int DEFAULT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `number_of_downloads` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `documents_contact_id_foreign` (`contact_id`),
  KEY `documents_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `documents_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `documents_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_activity` (
  `account_id` int unsigned NOT NULL,
  `activity_id` int unsigned NOT NULL,
  `emotion_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `emotion_activity_account_id_foreign` (`account_id`),
  KEY `emotion_activity_activity_id_foreign` (`activity_id`),
  KEY `emotion_activity_emotion_id_foreign` (`emotion_id`),
  CONSTRAINT `emotion_activity_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotion_activity_activity_id_foreign` FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotion_activity_emotion_id_foreign` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotion_call` (
  `account_id` int unsigned NOT NULL,
  `call_id` int unsigned NOT NULL,
  `emotion_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `emotion_call_account_id_foreign` (`account_id`),
  KEY `emotion_call_call_id_foreign` (`call_id`),
  KEY `emotion_call_emotion_id_foreign` (`emotion_id`),
  KEY `emotion_call_contact_id_foreign` (`contact_id`),
  CONSTRAINT `emotion_call_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotion_call_call_id_foreign` FOREIGN KEY (`call_id`) REFERENCES `calls` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotion_call_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotion_call_emotion_id_foreign` FOREIGN KEY (`emotion_id`) REFERENCES `emotions` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `emotion_primary_id` int unsigned NOT NULL,
  `emotion_secondary_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `emotions_emotion_primary_id_foreign` (`emotion_primary_id`),
  KEY `emotions_emotion_secondary_id_foreign` (`emotion_secondary_id`),
  CONSTRAINT `emotions_emotion_primary_id_foreign` FOREIGN KEY (`emotion_primary_id`) REFERENCES `emotions_primary` (`id`) ON DELETE CASCADE,
  CONSTRAINT `emotions_emotion_secondary_id_foreign` FOREIGN KEY (`emotion_secondary_id`) REFERENCES `emotions_secondary` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=134 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotions_primary` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `emotions_secondary` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `emotion_primary_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `emotions_secondary_emotion_primary_id_foreign` (`emotion_primary_id`),
  CONSTRAINT `emotions_secondary_emotion_primary_id_foreign` FOREIGN KEY (`emotion_primary_id`) REFERENCES `emotions_primary` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `post` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `entries_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `entries_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `export_jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `type` varchar(4) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location` varchar(6) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `filename` varchar(256) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` datetime DEFAULT NULL,
  `ended_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `export_jobs_account_id_foreign` (`account_id`),
  KEY `export_jobs_user_id_foreign` (`user_id`),
  KEY `export_jobs_uuid_index` (`uuid`),
  CONSTRAINT `export_jobs_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `export_jobs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `failed_jobs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `connection` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `queue` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `exception` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `genders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` char(1) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `genders_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `genders_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gift_photo` (
  `photo_id` int unsigned NOT NULL,
  `gift_id` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`photo_id`,`gift_id`),
  KEY `gift_photo_gift_id_foreign` (`gift_id`),
  CONSTRAINT `gift_photo_gift_id_foreign` FOREIGN KEY (`gift_id`) REFERENCES `gifts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gift_photo_photo_id_foreign` FOREIGN KEY (`photo_id`) REFERENCES `photos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `gifts` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `is_for` int unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `comment` longtext COLLATE utf8mb4_unicode_ci,
  `url` longtext COLLATE utf8mb4_unicode_ci,
  `amount` int DEFAULT NULL,
  `currency_id` int unsigned DEFAULT NULL,
  `status` varchar(8) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'idea',
  `date` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `gifts_contact_id_foreign` (`contact_id`),
  KEY `gifts_is_for_foreign` (`is_for`),
  KEY `gifts_currency_id_foreign` (`currency_id`),
  KEY `gifts_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `gifts_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gifts_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gifts_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `gifts_is_for_foreign` FOREIGN KEY (`is_for`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_job_reports` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `import_job_id` int unsigned NOT NULL,
  `contact_information` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `skipped` tinyint(1) NOT NULL,
  `skip_reason` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `import_job_reports_account_id_foreign` (`account_id`),
  KEY `import_job_reports_user_id_foreign` (`user_id`),
  KEY `import_job_reports_import_job_id_foreign` (`import_job_id`),
  CONSTRAINT `import_job_reports_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `import_job_reports_import_job_id_foreign` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs` (`id`) ON DELETE CASCADE,
  CONSTRAINT `import_job_reports_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `import_jobs` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vcard',
  `contacts_found` int DEFAULT NULL,
  `contacts_skipped` int DEFAULT NULL,
  `contacts_imported` int DEFAULT NULL,
  `filename` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `started_at` date DEFAULT NULL,
  `ended_at` date DEFAULT NULL,
  `failed` tinyint(1) NOT NULL DEFAULT '0',
  `failed_reason` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `import_jobs_account_id_foreign` (`account_id`),
  KEY `import_jobs_user_id_foreign` (`user_id`),
  CONSTRAINT `import_jobs_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `import_jobs_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `instances` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `current_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latest_version` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latest_release_notes` mediumtext COLLATE utf8mb4_unicode_ci,
  `number_of_versions_since_current_version` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `invitations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `invited_by_user_id` int unsigned NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `invitation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `invitations_account_id_foreign` (`account_id`),
  KEY `invitations_invited_by_user_id_foreign` (`invited_by_user_id`),
  CONSTRAINT `invitations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `invitations_invited_by_user_id_foreign` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `job_batches` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_jobs` int NOT NULL,
  `pending_jobs` int NOT NULL,
  `failed_jobs` int NOT NULL,
  `failed_job_ids` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `options` mediumtext COLLATE utf8mb4_unicode_ci,
  `cancelled_at` int DEFAULT NULL,
  `created_at` int NOT NULL,
  `finished_at` int DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `jobs` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `queue` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `payload` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `attempts` tinyint unsigned NOT NULL,
  `reserved_at` int unsigned DEFAULT NULL,
  `available_at` int unsigned NOT NULL,
  `created_at` int unsigned NOT NULL,
  PRIMARY KEY (`id`),
  KEY `jobs_queue_reserved_at_index` (`queue`,`reserved_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `journal_entries` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `date` datetime NOT NULL,
  `journalable_id` int NOT NULL,
  `journalable_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `journal_entries_account_id_foreign` (`account_id`),
  CONSTRAINT `journal_entries_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `life_event_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `default_life_event_category_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `core_monica_data` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `life_event_categories_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `life_event_categories_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `life_event_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `life_event_category_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `default_life_event_type_key` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `core_monica_data` tinyint(1) NOT NULL DEFAULT '0',
  `specific_information_structure` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `life_event_types_life_event_category_id_foreign` (`life_event_category_id`),
  KEY `life_event_types_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `life_event_types_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `life_event_types_life_event_category_id_foreign` FOREIGN KEY (`life_event_category_id`) REFERENCES `life_event_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `life_events` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `life_event_type_id` int unsigned NOT NULL,
  `reminder_id` int unsigned DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `note` mediumtext COLLATE utf8mb4_unicode_ci,
  `happened_at` datetime NOT NULL,
  `happened_at_month_unknown` tinyint(1) NOT NULL DEFAULT '0',
  `happened_at_day_unknown` tinyint(1) NOT NULL DEFAULT '0',
  `specific_information` text COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `life_events_contact_id_foreign` (`contact_id`),
  KEY `life_events_life_event_type_id_foreign` (`life_event_type_id`),
  KEY `life_events_reminder_id_foreign` (`reminder_id`),
  KEY `life_events_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `life_events_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `life_events_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `life_events_life_event_type_id_foreign` FOREIGN KEY (`life_event_type_id`) REFERENCES `life_event_types` (`id`) ON DELETE CASCADE,
  CONSTRAINT `life_events_reminder_id_foreign` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `messages` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `conversation_id` int unsigned NOT NULL,
  `content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `written_at` datetime NOT NULL,
  `written_by_me` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `messages_conversation_id_foreign` (`conversation_id`),
  KEY `messages_contact_id_foreign` (`contact_id`),
  KEY `messages_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `messages_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_conversation_id_foreign` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `metadata_love_relationships` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `relationship_id` int unsigned NOT NULL,
  `is_active` tinyint(1) NOT NULL,
  `notes` mediumtext COLLATE utf8mb4_unicode_ci,
  `meet_date` datetime DEFAULT NULL,
  `official_date` datetime DEFAULT NULL,
  `breakup_date` datetime DEFAULT NULL,
  `breakup_reason` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `metadata_love_relationships_account_id_foreign` (`account_id`),
  KEY `metadata_love_relationships_relationship_id_foreign` (`relationship_id`),
  CONSTRAINT `metadata_love_relationships_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `metadata_love_relationships_relationship_id_foreign` FOREIGN KEY (`relationship_id`) REFERENCES `relationships` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `migrations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `migration` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `batch` int NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=283 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `translation_key` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `modules_account_id_foreign` (`account_id`),
  CONSTRAINT `modules_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `body` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_favorited` tinyint(1) NOT NULL DEFAULT '0',
  `favorited_at` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `notes_contact_id_foreign` (`contact_id`),
  KEY `notes_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `notes_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notes_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_access_tokens` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `client_id` bigint unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `scopes` text COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_access_tokens_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_auth_codes` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned NOT NULL,
  `client_id` bigint unsigned NOT NULL,
  `scopes` text COLLATE utf8mb4_unicode_ci,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_auth_codes_user_id_index` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `owner_id` bigint unsigned DEFAULT NULL,
  `owner_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `secret` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `provider` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `redirect_uris` text COLLATE utf8mb4_unicode_ci,
  `grant_types` text COLLATE utf8mb4_unicode_ci,
  `personal_access_client` tinyint(1) NOT NULL DEFAULT '0',
  `revoked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_clients_owner_type_owner_id_index` (`owner_type`,`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_device_codes` (
  `id` char(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` bigint unsigned DEFAULT NULL,
  `client_id` char(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_code` char(8) COLLATE utf8mb4_unicode_ci NOT NULL,
  `scopes` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `user_approved_at` datetime DEFAULT NULL,
  `last_polled_at` datetime DEFAULT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `oauth_device_codes_user_code_unique` (`user_code`),
  KEY `oauth_device_codes_user_id_index` (`user_id`),
  KEY `oauth_device_codes_client_id_index` (`client_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_personal_access_clients` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `client_id` bigint unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `oauth_refresh_tokens` (
  `id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `access_token_id` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `revoked` tinyint(1) NOT NULL,
  `expires_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `oauth_refresh_tokens_access_token_id_index` (`access_token_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `occupations` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `company_id` int unsigned NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `salary` int DEFAULT NULL,
  `salary_unit` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currently_works_here` tinyint(1) DEFAULT '0',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `occupations_account_id_foreign` (`account_id`),
  KEY `occupations_contact_id_foreign` (`contact_id`),
  KEY `occupations_company_id_foreign` (`company_id`),
  CONSTRAINT `occupations_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `occupations_company_id_foreign` FOREIGN KEY (`company_id`) REFERENCES `companies` (`id`) ON DELETE CASCADE,
  CONSTRAINT `occupations_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `password_resets` (
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NOT NULL,
  KEY `password_resets_email_index` (`email`),
  KEY `password_resets_token_index` (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pet_categories` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_common` tinyint(1) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pets` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `pet_category_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pets_contact_id_foreign` (`contact_id`),
  KEY `pets_pet_category_id_foreign` (`pet_category_id`),
  KEY `pets_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `pets_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pets_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pets_pet_category_id_foreign` FOREIGN KEY (`pet_category_id`) REFERENCES `pet_categories` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `photos` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `original_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `new_filename` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `filesize` int DEFAULT NULL,
  `mime_type` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `photos_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `photos_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `places` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `street` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `city` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `province` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `postal_code` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `country` char(3) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `latitude` double DEFAULT NULL,
  `longitude` double DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `places_account_id_foreign` (`account_id`),
  CONSTRAINT `places_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recovery_codes` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `recovery` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `used` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `recovery_codes_account_id_foreign` (`account_id`),
  KEY `recovery_codes_user_id_foreign` (`user_id`),
  CONSTRAINT `recovery_codes_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `recovery_codes_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `relationship_type_groups` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `relationship_type_groups_account_id_name_index` (`account_id`,`name`),
  CONSTRAINT `relationship_type_groups_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `relationship_types` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_reverse_relationship` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `relationship_type_group_id` int unsigned NOT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `relationship_types_account_id_foreign` (`account_id`),
  KEY `relationship_types_relationship_type_group_id_foreign` (`relationship_type_group_id`),
  CONSTRAINT `relationship_types_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `relationship_types_relationship_type_group_id_foreign` FOREIGN KEY (`relationship_type_group_id`) REFERENCES `relationship_type_groups` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `relationships` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `relationship_type_id` int unsigned NOT NULL,
  `contact_is` int unsigned NOT NULL,
  `of_contact` int unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `relationships_relationship_type_id_foreign` (`relationship_type_id`),
  KEY `relationships_contact_is_foreign` (`contact_is`),
  KEY `relationships_of_contact_foreign` (`of_contact`),
  KEY `relationships_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `relationships_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `relationships_contact_is_foreign` FOREIGN KEY (`contact_is`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `relationships_of_contact_foreign` FOREIGN KEY (`of_contact`) REFERENCES `contacts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `relationships_relationship_type_id_foreign` FOREIGN KEY (`relationship_type_id`) REFERENCES `relationship_types` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder_outbox` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `reminder_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `planned_date` date NOT NULL,
  `nature` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'reminder',
  `notification_number_days_before` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reminder_outbox_account_id_foreign` (`account_id`),
  KEY `reminder_outbox_reminder_id_foreign` (`reminder_id`),
  KEY `reminder_outbox_user_id_foreign` (`user_id`),
  CONSTRAINT `reminder_outbox_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reminder_outbox_reminder_id_foreign` FOREIGN KEY (`reminder_id`) REFERENCES `reminders` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reminder_outbox_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminder_rules` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `number_of_days_before` int NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reminder_rules_account_id_foreign` (`account_id`),
  CONSTRAINT `reminder_rules_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `initial_date` date NOT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `frequency_type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `frequency_number` int DEFAULT NULL,
  `delible` tinyint(1) NOT NULL DEFAULT '1',
  `inactive` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `reminders_contact_id_foreign` (`contact_id`),
  KEY `reminders_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `reminders_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reminders_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reminders_sent` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `contact_id` int NOT NULL,
  `reminder_id` int DEFAULT NULL,
  `title` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `html_sent_content` longtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `sent_date` datetime NOT NULL,
  `scheduled_number_days_before` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sessions` (
  `id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `user_id` int DEFAULT NULL,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` text COLLATE utf8mb4_unicode_ci,
  `payload` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_activity` int NOT NULL,
  UNIQUE KEY `sessions_id_unique` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `special_dates` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned NOT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_age_based` tinyint(1) NOT NULL DEFAULT '0',
  `is_year_unknown` tinyint(1) NOT NULL DEFAULT '0',
  `date` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `special_dates_account_id_uuid_index` (`account_id`,`uuid`),
  KEY `special_dates_contact_id_foreign` (`contact_id`),
  CONSTRAINT `special_dates_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `special_dates_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `statistics` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `number_of_users` int NOT NULL,
  `number_of_contacts` int NOT NULL,
  `number_of_notes` int NOT NULL,
  `number_of_oauth_access_tokens` int NOT NULL,
  `number_of_oauth_clients` int NOT NULL,
  `number_of_offsprings` int NOT NULL,
  `number_of_progenitors` int NOT NULL,
  `number_of_relationships` int NOT NULL,
  `number_of_subscriptions` int NOT NULL,
  `number_of_reminders` int NOT NULL,
  `number_of_tasks` int NOT NULL,
  `number_of_kids` int NOT NULL,
  `number_of_activities` int NOT NULL,
  `number_of_addresses` int NOT NULL,
  `number_of_api_calls` int NOT NULL,
  `number_of_calls` int NOT NULL,
  `number_of_contact_fields` int NOT NULL,
  `number_of_contact_field_types` int NOT NULL,
  `number_of_debts` int NOT NULL,
  `number_of_entries` int NOT NULL,
  `number_of_gifts` int NOT NULL,
  `number_of_invitations_sent` int DEFAULT NULL,
  `number_of_accounts_with_more_than_one_user` int DEFAULT NULL,
  `number_of_tags` int DEFAULT NULL,
  `number_of_import_jobs` int DEFAULT NULL,
  `number_of_conversations` int DEFAULT NULL,
  `number_of_messages` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscription_items` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `subscription_id` bigint unsigned NOT NULL,
  `stripe_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_product` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `stripe_price` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `meter_id` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `quantity` int DEFAULT NULL,
  `meter_event_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `subscription_items_subscription_id_stripe_plan_unique` (`subscription_id`,`stripe_price`),
  KEY `subscription_items_stripe_id_index` (`stripe_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subscriptions` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_id` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_status` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `stripe_price` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` int DEFAULT NULL,
  `trial_ends_at` timestamp NULL DEFAULT NULL,
  `ends_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `subscriptions_account_id_stripe_status_index` (`account_id`,`stripe_status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `synctoken` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'contacts',
  `timestamp` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `synctoken_user_id_foreign` (`user_id`),
  KEY `synctoken_account_id_user_id_name_index` (`account_id`,`user_id`,`name`),
  CONSTRAINT `synctoken_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `synctoken_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tags` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_slug` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` mediumtext COLLATE utf8mb4_unicode_ci,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tags_account_id_foreign` (`account_id`),
  CONSTRAINT `tags_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tasks` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `contact_id` int unsigned DEFAULT NULL,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` longtext COLLATE utf8mb4_unicode_ci,
  `completed` tinyint(1) NOT NULL DEFAULT '0',
  `completed_at` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tasks_account_id_uuid_index` (`account_id`,`uuid`),
  KEY `tasks_contact_id_foreign` (`contact_id`),
  CONSTRAINT `tasks_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `tasks_contact_id_foreign` FOREIGN KEY (`contact_id`) REFERENCES `contacts` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `term_user` (
  `account_id` int unsigned NOT NULL,
  `user_id` int unsigned NOT NULL,
  `term_id` int unsigned NOT NULL,
  `ip_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  KEY `term_user_account_id_foreign` (`account_id`),
  KEY `term_user_user_id_foreign` (`user_id`),
  KEY `term_user_term_id_foreign` (`term_id`),
  CONSTRAINT `term_user_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `term_user_term_id_foreign` FOREIGN KEY (`term_id`) REFERENCES `terms` (`id`) ON DELETE CASCADE,
  CONSTRAINT `term_user_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `terms` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `term_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `term_content` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `privacy_version` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `privacy_content` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `u2f_key` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'key',
  `user_id` int unsigned NOT NULL,
  `keyHandle` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `publicKey` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `counter` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `u2f_key_publickey_unique` (`publicKey`),
  KEY `u2f_key_user_id_foreign` (`user_id`),
  CONSTRAINT `u2f_key_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `uuid` char(36) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `first_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `last_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `me_contact_id` int unsigned DEFAULT NULL,
  `admin` tinyint(1) NOT NULL DEFAULT '0',
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `remember_token` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `google2fa_secret` varchar(256) COLLATE utf8mb4_unicode_ci NOT NULL,
  `account_id` int unsigned NOT NULL,
  `timezone` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `currency_id` int unsigned DEFAULT NULL,
  `locale` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'en',
  `metric` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'fahrenheit',
  `fluid_container` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'false',
  `contacts_sort_order` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'firstnameAZ',
  `name_order` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'firstname_lastname_nickname',
  `invited_by_user_id` int unsigned DEFAULT NULL,
  `dashboard_active_tab` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'calls',
  `gifts_active_tab` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ideas',
  `profile_active_tab` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'notes',
  `profile_new_life_event_badge_seen` tinyint(1) NOT NULL DEFAULT '0',
  `temperature_scale` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'celsius',
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_me_contact_id_foreign` (`me_contact_id`),
  KEY `users_currency_id_foreign` (`currency_id`),
  KEY `users_invited_by_user_id_foreign` (`invited_by_user_id`),
  KEY `users_account_id_uuid_index` (`account_id`,`uuid`),
  CONSTRAINT `users_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `users_currency_id_foreign` FOREIGN KEY (`currency_id`) REFERENCES `currencies` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_invited_by_user_id_foreign` FOREIGN KEY (`invited_by_user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `users_me_contact_id_foreign` FOREIGN KEY (`me_contact_id`) REFERENCES `contacts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `weather` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `account_id` int unsigned NOT NULL,
  `place_id` int unsigned NOT NULL,
  `weather_json` varchar(2000) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `weather_account_id_foreign` (`account_id`),
  KEY `weather_place_id_foreign` (`place_id`),
  CONSTRAINT `weather_account_id_foreign` FOREIGN KEY (`account_id`) REFERENCES `accounts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `weather_place_id_foreign` FOREIGN KEY (`place_id`) REFERENCES `places` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `webauthn_keys` (
  `id` int unsigned NOT NULL AUTO_INCREMENT,
  `user_id` int unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'key',
  `credentialId` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `transports` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `attestationType` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trustPath` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `aaguid` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `credentialPublicKey` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `counter` int NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `webauthn_keys_user_id_foreign` (`user_id`),
  KEY `webauthn_keys_credentialid_index` (`credentialId`),
  CONSTRAINT `webauthn_keys_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

LOCK TABLES `migrations` WRITE;
/*!40000 ALTER TABLE `migrations` DISABLE KEYS */;
INSERT INTO `migrations` VALUES (1,'2014_10_12_000000_create_users_table',1),(2,'2014_10_12_100000_create_password_resets_table',1),(3,'2016_06_01_000001_create_oauth_auth_codes_table',1),(4,'2016_06_01_000002_create_oauth_access_tokens_table',1),(5,'2016_06_01_000003_create_oauth_refresh_tokens_table',1),(6,'2016_06_01_000004_create_oauth_clients_table',1),(7,'2016_06_01_000005_create_oauth_personal_access_clients_table',1),(8,'2016_06_07_234741_create_account_table',1),(9,'2016_06_08_003006_add_account_info_table',1),(10,'2016_06_08_005413_create_contacts_table',1),(11,'2016_06_25_224219_create_reminder_type_table',1),(12,'2016_06_28_191025_create_tasks_table',1),(13,'2016_06_30_185050_create_notes_table',1),(14,'2016_07_25_133835_add_width_field',1),(15,'2016_08_28_122938_create_kids_table',1),(16,'2016_08_28_215159_create_relations_table',1),(17,'2016_09_03_202027_add_reminder_id_to_contacts',1),(18,'2016_09_05_134937_add_last_talked_to_field',1),(19,'2016_09_05_135927_add_people_id_to_contacts',1),(20,'2016_09_05_145111_add_name_info_to_peoples',1),(21,'2016_09_06_213550_create_activity_type_table',1),(22,'2016_09_10_164406_create_jobs_table',1),(23,'2016_09_10_170122_create_notifications_table',1),(24,'2016_09_12_014120_create_failed_jobs_table',1),(25,'2016_09_30_014720_add_kid_to_reminder',1),(26,'2016_10_15_024156_add_deleted_at_to_users',1),(27,'2016_10_19_155139_create_cache_table',1),(28,'2016_10_19_155800_create_sessions_table',1),(29,'2016_10_21_022941_add_statistics_table',1),(30,'2016_10_24_013543_add_journal_setting_to_users',1),(31,'2016_10_24_014257_create_journal_tables',1),(32,'2016_10_28_002518_add_metric_to_settings',1),(33,'2016_11_01_014353_create_activities_table',1),(34,'2016_11_01_015957_add_icon_column',1),(35,'2016_11_03_150307_add_activity_location_to_activities',1),(36,'2016_11_09_013049_add_events_table',1),(37,'2016_12_08_011555_remove_type_from_notes',1),(38,'2016_12_13_133945_add_gifts_table',1),(39,'2016_12_28_150831_change_title_column',1),(40,'2017_01_14_200815_add_facebook_columns_to_users_table',1),(41,'2017_01_15_045025_add_colors_to_users',1),(42,'2017_01_22_142645_add_fields_to_contacts',1),(43,'2017_01_23_043831_change_people_to_contact_for_kids',1),(44,'2017_01_26_013524_change_people_to_significantother',1),(45,'2017_01_26_022852_change_notes_to_contact',1),(46,'2017_01_26_034553_add_notes_count_to_contact',1),(47,'2017_01_27_024356_change_people_in_events',1),(48,'2017_01_28_180156_remove_deleted_at_from_significant_others',1),(49,'2017_01_28_184901_remove_deleted_at_from_kids',1),(50,'2017_01_28_193913_remove_deleted_at_from_notes',1),(51,'2017_01_28_222114_remove_viewed_at_from_contacts',1),(52,'2017_01_29_175146_remove_delete_at_from_activities',1),(53,'2017_01_29_175629_add_number_activities_to_contacts',1),(54,'2017_01_31_025849_add_activity_statistics_table',1),(55,'2017_02_02_232450_add_confirmation',1),(56,'2017_02_04_225618_change_reminders_table',1),(57,'2017_02_05_035925_add_gifts_metrics_to_contacts',1),(58,'2017_02_05_041740_change_gifts_table',1),(59,'2017_02_05_042122_change_people_to_contact_for_gifts',1),(60,'2017_02_07_041607_change_tasks_table',1),(61,'2017_02_07_051355_add_number_tasks_to_contact',1),(62,'2017_02_08_002251_change_number_tasks_contact',1),(63,'2017_02_08_025358_add_sort_preferences_to_users',1),(64,'2017_02_10_195613_remove_notifications_table',1),(65,'2017_02_10_214714_remove_people_table',1),(66,'2017_02_10_215405_remove_entities_table',1),(67,'2017_02_10_224355_calculate_statistics',1),(68,'2017_02_11_154900_add_avatars_to_contacts',1),(69,'2017_02_12_134220_create_entries_table',1),(70,'2017_05_03_155254_move_significant_other_data',1),(71,'2017_05_04_164723_remove_contact_encryption',1),(72,'2017_05_04_185921_add_title_to_activities',1),(73,'2017_05_04_193252_alter_activity_nullable',1),(74,'2017_05_08_164514_remove_encryption_tasks',1),(75,'2017_05_30_002239_remove_predefined_reminders',1),(76,'2017_05_30_023116_create_money_table',1),(77,'2017_06_07_173437_add_multiple_genders_choices',1),(78,'2017_06_10_152945_add_social_networks_to_contacts',1),(79,'2017_06_10_155349_create_currencies_data',1),(80,'2017_06_11_025227_remove_encryption_journal',1),(81,'2017_06_11_110735_change_unique_constraint_for_contacts',1),(82,'2017_06_13_035059_remove_gifts_encryption',1),(83,'2017_06_13_195740_add_company_to_contacts',1),(84,'2017_06_14_131803_remove_bern_timezone',1),(85,'2017_06_14_132911_add_zar_currency_to_currencies_table',1),(86,'2017_06_16_215256_add_about_who_to_reminders',1),(87,'2017_06_17_010900_fix_contacts_table',1),(88,'2017_06_17_153814_refactor_user_table',1),(89,'2017_06_19_105842_add_stripe_fields_to_users',1),(90,'2017_06_20_121345_add_invitations_statistics',1),(91,'2017_06_22_210813_add_name_order_to_users',1),(92,'2017_06_27_134704_create_import_table',1),(93,'2017_06_29_211725_add_import_job_to_statistics',1),(94,'2017_06_29_230523_add_gravatar_url_to_users',1),(95,'2017_07_02_155736_create_tags_table',1),(96,'2017_07_04_132743_add_tags_to_statistics',1),(97,'2017_07_09_164312_update_bad_translation_key',1),(98,'2017_07_12_014244_create_calls_table',1),(99,'2017_07_17_005012_drop_reminders_count_from_contacts',1),(100,'2017_07_18_215312_add_danish_kroner_to_currencies_table',1),(101,'2017_07_18_215758_add_indian_rupee_to_currencies_table',1),(102,'2017_07_19_094503_add_brazilian_real_to_currencies',1),(103,'2017_07_22_153209_create_instance_table',1),(104,'2017_07_26_220021_change_contacts_table',1),(105,'2017_08_02_152838_change_string_to_boolean_for_reminders',1),(106,'2017_08_06_085629_change_events_data',1),(107,'2017_08_06_153253_move_kids_to_contacts',1),(108,'2017_08_16_041431_add_contact_avatar_location',1),(109,'2017_08_21_224835_remove_paid_limitations_for_current_users',1),(110,'2017_09_10_125918_remove_unusued_counters',1),(111,'2017_09_13_095923_add_tracking_table',1),(112,'2017_09_13_191714_add_partial_notion',1),(113,'2017_10_14_083556_change_gift_column_structure',1),(114,'2017_10_17_170803_change_gift_structure',1),(115,'2017_10_19_134816_create_activity_contact_table',1),(116,'2017_10_19_135215_move_activities_to_pivot_table',1),(117,'2017_10_25_102923_remove_contact_id_activities_table',1),(118,'2017_11_01_122541_add_met_through_to_contacts',1),(119,'2017_11_02_202601_add_is_dead_to_contacts',1),(120,'2017_11_10_174654_create_contact_fields_table',1),(121,'2017_11_10_181043_migrate_contacts_information',1),(122,'2017_11_10_202620_move_addresses_from_contact_to_addresses',1),(123,'2017_11_10_204035_delete_contact_fields_from_contacts',1),(124,'2017_11_20_115635_change-amount-to-double-on-debts',1),(125,'2017_11_27_083043_add_more_statistics',1),(126,'2017_11_27_134403_add_new_avatar_to_contacts',1),(127,'2017_11_27_202857_change_tasks_table_structure',1),(128,'2017_12_01_113748_update_notes',1),(129,'2017_12_04_164831_create_ages_table',1),(130,'2017_12_04_165421_move_ages_data',1),(131,'2017_12_10_181535_remove_important_dates_table',1),(132,'2017_12_10_205328_add_account_id_to_activities',1),(133,'2017_12_10_214545_add_last_consulted_at_to_contacts',1),(134,'2017_12_13_115857_create_day_table',1),(135,'2017_12_21_163616_update_journal_entries_with_existing_activities',1),(136,'2017_12_21_170327_add_google2fa_secret_to_users',1),(137,'2017_12_24_115641_create_pets_table',1),(138,'2017_12_31_114224_add_dashboard_tab_to_users',1),(139,'2018_01_15_105858_create_additional_reminders_table',1),(140,'2018_01_16_203358_add_gift_received',1),(141,'2018_01_16_212320_rename_gift_columns',1),(142,'2018_01_17_230820_add_gift_tab_view_to_users',1),(143,'2018_01_27_014146_add_custom_gender',1),(144,'2018_02_25_202752_change_locale_in_db',1),(145,'2018_02_28_223747_update_notification_table',1),(146,'2018_03_03_204440_create_relationship_type_table',1),(147,'2018_03_18_085815_populate_default_relationship_type_tables',1),(148,'2018_03_18_090209_populate_relationship_type_tables_with_default_values',1),(149,'2018_03_18_090345_migrate_current_relationship_table_to_new_relationship_structure',1),(150,'2018_03_24_083258_migrate_offsprings',1),(151,'2018_04_04_220850_create_default_modules_table',1),(152,'2018_04_04_222608_create_account_modules_table',1),(153,'2018_04_10_205655_fix_production_error',1),(154,'2018_04_10_222515_migrate-modules',1),(155,'2018_04_13_131008_fix-contacts-data',1),(156,'2018_04_13_205231_create_changes_table',1),(157,'2018_04_14_081052_fix_wrong_gender',1),(158,'2018_04_19_190239_stay_in_touch',1),(159,'2018_05_06_061227_external_countries',1),(160,'2018_05_07_070458_create_terms_table',1),(161,'2018_05_13_110706_add_ex_wife_husband_relationship',1),(162,'2018_05_16_143631_add_nickname_to_contacts',1),(163,'2018_05_16_214222_add_timestamps_to_currencies',1),(164,'2018_05_20_121028_accept_terms',1),(165,'2018_05_20_225034_change_name_order_user-_preferencies',1),(166,'2018_05_24_160546_fix-inconsistant-reminder-time',1),(167,'2018_06_10_191450_add_love_metadata_relationshisp',1),(168,'2018_06_10_221746_migrate_entries_objects',1),(169,'2018_06_11_184017_change_default_user_table',1),(170,'2018_06_13_000100_create_u2f_key_table',1),(171,'2018_06_14_212502_change_default_name_order_user_table',1),(172,'2018_07_03_204220_create_default_activity_type_groups_table',1),(173,'2018_07_08_104306_update-timestamps-timezone',1),(174,'2018_07_26_104306_create-conversations',1),(175,'2018_08_06_145046_add_starred_to_contacts',1),(176,'2018_08_09_18000_fix-empty-reminder-time',1),(177,'2018_08_18_180426_add_legacy_free_plan',1),(178,'2018_08_29_124804_add_conversations_to_statistics',1),(179,'2018_08_29_222051_add_conversations_to_modules',1),(180,'2018_08_31_020908_create_life_events_table',1),(181,'2018_09_02_150531_contact_archiving',1),(182,'2018_09_05_025008_add_default_profile_view',1),(183,'2018_09_05_213507_mark_modules_migrated',1),(184,'2018_09_13_135926_add_description_field_to_contacts',1),(185,'2018_09_18_142844_remove_events',1),(186,'2018_09_23_024528_add_documents_table',1),(187,'2018_09_29_114125_add_reminder_to_life_events',1),(188,'2018_10_01_211757_add_number_of_views',1),(189,'2018_10_04_181116_life_event_vehicle',1),(190,'2018_10_07_120133_fix_json_column',1),(191,'2018_10_16_000703_add_documents_to_module_table',1),(192,'2018_10_19_081816_life_event_tattoo',1),(193,'2018_10_27_230346_fix_non_english_tab_slugs',1),(194,'2018_10_28_165814_email_verified',1),(195,'2018_11_11_145035_remove_changelogs_table',1),(196,'2018_11_15_172333_make_contact_id_nullable_in_tasks',1),(197,'2018_11_18_021908_create_images_table',1),(198,'2018_11_21_212932_add_contacts_uuid',1),(199,'2018_11_25_020818_add_contact_photo_table',1),(200,'2018_11_30_154729_recovery_codes',1),(201,'2018_12_08_233140_add_who_called_to_calls',1),(202,'2018_12_09_023232_add_emotions_table',1),(203,'2018_12_09_145956_create_emotion_call_table',1),(204,'2018_12_16_195440_add_gps_coordinates_to_addressess',1),(205,'2018_12_19_002819_create_places_table',1),(206,'2018_12_19_003444_move_addresses_data',1),(207,'2018_12_21_235418_add_weather_table',1),(208,'2018_12_22_021123_add_weather_preferences_to_users',1),(209,'2018_12_22_200413_add_reminder_initial_date_to_reminders',1),(210,'2018_12_24_164256_add_companies_table',1),(211,'2018_12_24_220019_add_occupations_table',1),(212,'2018_12_25_001736_add_linkedin_to_default_contact_field_type',1),(213,'2018_12_25_012011_move_linkedin_data_to_contact_field_type',1),(214,'2018_12_29_091017_default_temperature_scale',1),(215,'2018_12_29_135516_sync_token',1),(216,'2019_01_05_152329_add_reminder_ids_to_contacts',1),(217,'2019_01_05_152405_migrate_previous_remiders',1),(218,'2019_01_05_152456_drop_special_date_id_from_reminders',1),(219,'2019_01_05_152526_schedule_new_reminders',1),(220,'2019_01_05_202557_add_foreign_keys_to_reminder',1),(221,'2019_01_05_202748_add_foreign_key_to_reminder_rule',1),(222,'2019_01_05_202938_add_foreign_key_to_contacts',1),(223,'2019_01_05_203201_add_foreign_key_for_reminder_in_life-events_table',1),(224,'2019_01_06_135133_update_u2f_key_table',1),(225,'2019_01_06_150143_add_inactive_flag_to_reminders',1),(226,'2019_01_06_190036_u2f_key_name',1),(227,'2019_01_11_142944_add_foreign_keys_to_activities',1),(228,'2019_01_11_183717_change_activities_date_type',1),(229,'2019_01_17_093812_add_admin_user',1),(230,'2019_01_18_142032_add_dav_uuid',1),(231,'2019_01_22_034555_create_emotion_activity_table',1),(232,'2019_01_24_221539_change_activity_model_location',1),(233,'2019_01_31_223600_add_swiss_chf_to_currencies_table',1),(234,'2019_02_08_234959_remove_users_without_account',1),(235,'2019_02_09_200203_add_gender_type',1),(236,'2019_02_17_112452_add_default_gender',1),(237,'2019_02_20_205744_allow_gender_null',1),(238,'2019_02_24_223855_remove_relation_type_name',1),(239,'2019_03_27_103012_set_default_profile_links',1),(240,'2019_03_29_163611_add_webauthn',1),(241,'2019_05_05_194746_add_cron_schedule',1),(242,'2019_05_15_205533_rename_preferences',1),(243,'2019_05_26_000000_add_relationship_table_indexes',1),(244,'2019_05_27_000000_populate_relationship_type_tables_with_stepparent_values',1),(245,'2019_08_12_213308_change_avatars_structure',1),(246,'2019_08_12_222938_create_avatars_for_existing_contacts',1),(247,'2019_08_13_160332_add_me_contact_on_user',1),(248,'2019_08_14_091427_update_stripe_columns',1),(249,'2019_09_04_075311_fix_tattoo_or_piercing_translation',1),(250,'2019_12_17_024553_add_foreign_keys',1),(251,'2019_12_21_100315_change_gift_status',1),(252,'2019_12_21_194559_add_photo_gift',1),(253,'2019_12_27_23533_rename_picnicked',1),(254,'2020_02_03_015403_create_audit_log_table',1),(255,'2020_02_18_211620_add_contact_field_label',1),(256,'2020_03_22_132429_rename_birthday_reminder_title_deceased',1),(257,'2020_03_25_055551_add_address_book',1),(258,'2020_03_25_065551_add_addressbook_subscription',1),(259,'2020_03_25_082324_add_contact_address_book_id',1),(260,'2020_03_25_201407_add_contact_vcard_data',1),(261,'2020_04_24_185810_remove_duplicate_currency',1),(262,'2020_04_24_205810_currencies_table_seed',1),(263,'2020_04_24_212138_update_amount_format',1),(264,'2020_05_08_072433_google2fa_column_size',1),(265,'2020_05_31_091556_custom_life_event_types',1),(266,'2020_08_05_184814_upgrade_passport',1),(267,'2020_11_01_000001_create_subscription_items_table',1),(268,'2020_12_19_205923_add_uuids',1),(269,'2021_04_23_190837_remove_reminder_sent',1),(270,'2021_09_27_023405_create_job_batches_table',1),(271,'2021_10_11_060512_add_distant_etag',1),(272,'2021_10_14_212144_v_card_company',1),(273,'2022_01_01_202745_add_export_jobs',1),(274,'2022_01_02_222042_contact_soft_delete',1),(275,'2022_04_25_165338_cashier_stripe_rename_plan',1),(276,'2024_05_03_100000_update_webauthn_keys',1),(277,'2024_06_01_000001_create_oauth_device_codes_table',1),(278,'2026_05_25_100000_drop_adorable_avatar_columns',1),(279,'2026_05_25_200000_restore_tasks_contact_id_nullable',1),(280,'2026_05_25_210000_rename_subscriptions_name_to_type_for_cashier_15',1),(281,'2026_05_26_000000_add_meter_columns_to_subscription_items_for_cashier_16',1),(282,'2026_05_26_000001_upgrade_oauth_clients_for_passport_13',1);
/*!40000 ALTER TABLE `migrations` ENABLE KEYS */;
UNLOCK TABLES;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

