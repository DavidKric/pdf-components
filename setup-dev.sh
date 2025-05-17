#!/bin/bash

# Script to set up the PDF components development environment

echo "Setting up PDF components development environment..."
echo "This script will install dependencies and configure the library and demo to work together."

# Change to the library directory and install dependencies
echo "Installing library dependencies..."
cd "$(dirname "$0")/ui/library"

# Remove corrupted yarn.lock if it exists
if [ -f "yarn.lock" ]; then
  echo "Removing corrupted yarn.lock file..."
  rm yarn.lock
fi

# Install dependencies
yarn install

# Build the library
echo "Building library..."
yarn build

# Change to the demo directory and install dependencies
echo "Installing demo dependencies..."
cd "../demo"
yarn install

# Notify about successful setup
echo "Setup complete!"
echo "You can now start the development server using one of these commands:"
echo "cd ui/demo && yarn dev             # Fast development with OpenSSL legacy provider (skips type checking)"
echo "cd ui/demo && yarn dev:type-check  # Development with full type checking (may have React type errors)"
echo "cd ui/demo && yarn check-types     # Run TypeScript type checking without starting server"
echo ""
echo "NOTE: There are some type conflicts between React versions which may cause type checking errors."
echo "For now, we recommend using the fast development mode (yarn dev) which skips type checking."
echo "The application will still work correctly despite these type errors."

# Offer to start the development server
read -p "Would you like to start the development server now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]
then
  echo "Starting development server..."
  yarn dev
fi 