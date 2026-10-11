CREATE TABLE `societies` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(160) NOT NULL,
  `code` VARCHAR(40) NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `societies_code_key` (`code`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `users` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `email` VARCHAR(180) NOT NULL,
  `password_hash` VARCHAR(255) NOT NULL,
  `role` ENUM('SOCIETY_ADMIN', 'RESIDENT') NOT NULL DEFAULT 'RESIDENT',
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `users_society_id_email_key` (`society_id`, `email`),
  INDEX `users_society_id_role_idx` (`society_id`, `role`),
  CONSTRAINT `users_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `categories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `name` VARCHAR(80) NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `categories_society_id_name_key` (`society_id`, `name`),
  CONSTRAINT `categories_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `subcategories` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `category_id` INTEGER NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `subcategories_category_id_name_key` (`category_id`, `name`),
  INDEX `subcategories_society_id_idx` (`society_id`),
  CONSTRAINT `subcategories_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contacts` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `contact_code` VARCHAR(20) NOT NULL,
  `category_id` INTEGER NOT NULL,
  `subcategory_id` INTEGER NOT NULL,
  `person_name` VARCHAR(140) NOT NULL,
  `gender` ENUM('FEMALE', 'MALE', 'NON_BINARY', 'OTHER', 'PREFER_NOT_TO_SAY') NOT NULL,
  `photo_path` VARCHAR(255) NULL,
  `mobile_number` VARCHAR(20) NOT NULL,
  `alternate_mobile` VARCHAR(20) NULL,
  `whatsapp_available` BOOLEAN NOT NULL DEFAULT false,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_by_id` INTEGER NULL,
  `updated_by_id` INTEGER NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `contacts_society_id_contact_code_key` (`society_id`, `contact_code`),
  INDEX `contacts_society_id_person_name_idx` (`society_id`, `person_name`),
  INDEX `contacts_society_id_mobile_number_idx` (`society_id`, `mobile_number`),
  INDEX `contacts_society_id_status_idx` (`society_id`, `status`),
  INDEX `contacts_category_id_subcategory_id_idx` (`category_id`, `subcategory_id`),
  CONSTRAINT `contacts_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `contacts_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `contacts_subcategory_id_fkey` FOREIGN KEY (`subcategory_id`) REFERENCES `subcategories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `contacts_created_by_id_fkey` FOREIGN KEY (`created_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `contacts_updated_by_id_fkey` FOREIGN KEY (`updated_by_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_work_details` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `contact_id` INTEGER NOT NULL,
  `experience_years` INTEGER NULL,
  `working_since` INTEGER NULL,
  `preferred_start` VARCHAR(10) NULL,
  `preferred_end` VARCHAR(10) NULL,
  `service_area` VARCHAR(160) NULL,
  `availability` VARCHAR(120) NULL,
  `charges` VARCHAR(120) NULL,
  `remarks` TEXT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `contact_work_details_contact_id_key` (`contact_id`),
  CONSTRAINT `contact_work_details_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_working_days` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `work_detail_id` INTEGER NOT NULL,
  `day` ENUM('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY') NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `contact_working_days_work_detail_id_day_key` (`work_detail_id`, `day`),
  CONSTRAINT `contact_working_days_work_detail_id_fkey` FOREIGN KEY (`work_detail_id`) REFERENCES `contact_work_details`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `work_types` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  `source_note` VARCHAR(255) NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `work_types_society_id_name_key` (`society_id`, `name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_work_types` (
  `contact_id` INTEGER NOT NULL,
  `work_type_id` INTEGER NOT NULL,
  PRIMARY KEY (`contact_id`, `work_type_id`),
  CONSTRAINT `contact_work_types_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `contact_work_types_work_type_id_fkey` FOREIGN KEY (`work_type_id`) REFERENCES `work_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `services` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `name` VARCHAR(120) NOT NULL,
  `is_system` BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `services_society_id_name_key` (`society_id`, `name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_services` (
  `contact_id` INTEGER NOT NULL,
  `service_id` INTEGER NOT NULL,
  PRIMARY KEY (`contact_id`, `service_id`),
  CONSTRAINT `contact_services_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `contact_services_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `flats` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `building` VARCHAR(40) NOT NULL,
  `flat_number` VARCHAR(40) NOT NULL,
  `floor` VARCHAR(20) NULL,
  `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `flats_society_id_building_flat_number_key` (`society_id`, `building`, `flat_number`),
  INDEX `flats_society_id_status_idx` (`society_id`, `status`),
  CONSTRAINT `flats_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_flat_associations` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `contact_id` INTEGER NOT NULL,
  `flat_id` INTEGER NOT NULL,
  `relationship` VARCHAR(100) NULL,
  `timing` VARCHAR(120) NULL,
  `remarks` TEXT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `contact_flat_associations_contact_id_flat_id_relationship_key` (`contact_id`, `flat_id`, `relationship`),
  INDEX `contact_flat_associations_society_id_flat_id_idx` (`society_id`, `flat_id`),
  CONSTRAINT `contact_flat_associations_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `contact_flat_associations_flat_id_fkey` FOREIGN KEY (`flat_id`) REFERENCES `flats`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `medical_details` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `contact_id` INTEGER NOT NULL,
  `specialization` VARCHAR(120) NULL,
  `clinic_name` VARCHAR(160) NULL,
  `clinic_address` TEXT NULL,
  `clinic_phone` VARCHAR(20) NULL,
  `consultation_timing` VARCHAR(120) NULL,
  `appointment_availability` VARCHAR(120) NULL,
  `home_visit_status` BOOLEAN NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `medical_details_contact_id_key` (`contact_id`),
  CONSTRAINT `medical_details_contact_id_fkey` FOREIGN KEY (`contact_id`) REFERENCES `contacts`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `contact_sequences` (
  `society_id` INTEGER NOT NULL,
  `next_value` INTEGER NOT NULL DEFAULT 1,
  PRIMARY KEY (`society_id`),
  CONSTRAINT `contact_sequences_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;

CREATE TABLE `audit_logs` (
  `id` INTEGER NOT NULL AUTO_INCREMENT,
  `society_id` INTEGER NOT NULL,
  `actor_user_id` INTEGER NULL,
  `action` VARCHAR(80) NOT NULL,
  `entity_type` VARCHAR(80) NOT NULL,
  `entity_id` INTEGER NULL,
  `metadata` JSON NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `audit_logs_society_id_entity_type_entity_id_idx` (`society_id`, `entity_type`, `entity_id`),
  CONSTRAINT `audit_logs_society_id_fkey` FOREIGN KEY (`society_id`) REFERENCES `societies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci ENGINE = InnoDB;
