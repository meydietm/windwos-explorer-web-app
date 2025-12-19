CREATE TABLE IF NOT EXISTS "files" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"folder_id" bigint NOT NULL,
	"name" varchar(255) NOT NULL,
	"size" integer,
	"mime_type" varchar(120),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "folders" DROP CONSTRAINT "folders_parent_id_folders_id_fk";
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "files" ADD CONSTRAINT "files_folder_id_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."folders"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "files_folder_id_idx" ON "files" USING btree ("folder_id");