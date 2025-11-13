#!/usr/bin/env bash

set -eo pipefail

KEY_CHAIN=build.keychain
MACOS_CERT_P12_FILE=certificate.p12

# Check if the required variables are set
if [ -z "$MACOS_CERT_P12" ]; then
  echo "Error: MACOS_CERT_P12 is not set."
  exit 1
fi

if [ -z "$MACOS_CERT_PASSWORD" ]; then
  echo "Error: MACOS_CERT_PASSWORD is not set."
  exit 1
fi

variable_length=${#MACOS_CERT_P12}
echo "MACOS_CERT_P12 is set. Length: $variable_length"

# Recreate the certificate from the secure environment variable
echo -n "$MACOS_CERT_P12" | base64 -d > "$MACOS_CERT_P12_FILE"
file_size=$(stat -f%z "$MACOS_CERT_P12_FILE")
echo "Certificate size is $file_size bytes"

if [ "$file_size" -eq 0 ]; then
  echo "Error: Decoded certificate file is empty."
  rm -f "$MACOS_CERT_P12_FILE"
  exit 1
fi

# Delete existing keychain if it exists
security delete-keychain $KEY_CHAIN || true

# Create a keychain
security create-keychain -p actions $KEY_CHAIN

# Make the keychain the default so identities are found
security default-keychain -s $KEY_CHAIN

# Unlock the keychain
security unlock-keychain -p actions $KEY_CHAIN

# The latest Developer ID Intermediate Certificate from Apple is
# missing on GitHub Actions (?), but we need it for the cert to be valid
curl -L https://www.apple.com/certificateauthority/DeveloperIDG2CA.cer -o DeveloperIDG2CA.cer
security add-trusted-cert -d -r unspecified -k $KEY_CHAIN DeveloperIDG2CA.cer
rm -f DeveloperIDG2CA.cer

security import $MACOS_CERT_P12_FILE -k $KEY_CHAIN -P "$MACOS_CERT_PASSWORD" -T /usr/bin/codesign;

security set-key-partition-list -S apple-tool:,apple: -s -k actions $KEY_CHAIN

# Debugging output
security find-identity

# remove certs
rm -f "$MACOS_CERT_P12_FILE"
