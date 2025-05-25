#!/bin/bash

# Update system packages
sudo apt-get update

# Install Node.js 20 (required by package.json engines)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm globally
sudo npm install -g pnpm@8.15.4

# Install Shopify CLI globally
sudo npm install -g @shopify/cli @shopify/theme

# Add Node.js, pnpm, and Shopify CLI to PATH in /etc/profile
echo 'export PATH="/usr/bin:$PATH"' | sudo tee -a /etc/profile
echo 'export PATH="/usr/local/bin:$PATH"' | sudo tee -a /etc/profile

# Source the profile to make sure PATH is updated
source /etc/profile

# Install project dependencies
pnpm install

# Verify installations
node --version
pnpm --version
shopify version

# Verify Shopify CLI theme commands are available
shopify theme --help