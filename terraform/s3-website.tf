# S3 Bucket para website estático
resource "aws_s3_bucket" "website" {
  bucket = "mb-website-${random_id.bucket_suffix.hex}"

  tags = {
    Project     = var.project
    Environment = var.environment
  }
}

resource "aws_s3_bucket_website_configuration" "website" {
  bucket = aws_s3_bucket.website.id

  index_document {
    suffix = "index.html"
  }

  error_document {
    key = "index.html"
  }
}

# Bloquear acceso público (solo CloudFront puede acceder)
resource "aws_s3_bucket_public_access_block" "website" {
  bucket = aws_s3_bucket.website.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
