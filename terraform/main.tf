provider "aws" {
  region = "us-east-1"
}

# S3 Bucket para imágenes de productos
resource "aws_s3_bucket" "images" {
  bucket = "mb-product-images-${random_id.bucket_suffix.hex}"

  tags = {
    Project     = "MedAndBeauty"
    Environment = "production"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

resource "aws_s3_bucket_public_access_block" "images" {
  bucket = aws_s3_bucket.images.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false
}

resource "aws_s3_bucket_policy" "images_public_read" {
  bucket = aws_s3_bucket.images.id
  depends_on = [aws_s3_bucket_public_access_block.images]

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "PublicReadGetObject"
        Effect    = "Allow"
        Principal = "*"
        Action    = "s3:GetObject"
        Resource  = "${aws_s3_bucket.images.arn}/*"
      }
    ]
  })
}

resource "aws_s3_bucket_cors_configuration" "images" {
  bucket = aws_s3_bucket.images.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET"]
    allowed_origins = ["*"]
    max_age_seconds = 3600
  }
}

# DynamoDB - Tabla de productos
resource "aws_dynamodb_table" "products" {
  name           = "mb_products"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "brand"
  range_key      = "product_id"

  attribute {
    name = "brand"
    type = "S"
  }

  attribute {
    name = "product_id"
    type = "S"
  }

  attribute {
    name = "is_active"
    type = "S"
  }

  attribute {
    name = "price"
    type = "N"
  }

  global_secondary_index {
    name            = "price-index"
    hash_key        = "is_active"
    range_key       = "price"
    projection_type = "ALL"
    read_capacity   = 5
    write_capacity  = 5
  }

  tags = {
    Project     = "MedAndBeauty"
    Environment = "production"
  }
}

# DynamoDB - Tabla de usuarios
resource "aws_dynamodb_table" "users" {
  name           = "mb_users"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "email"

  attribute {
    name = "email"
    type = "S"
  }

  tags = {
    Project     = "MedAndBeauty"
    Environment = "production"
  }
}
