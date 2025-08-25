# Keyboard Layout Detector Extension

A Chrome extension that automatically detects and corrects keyboard layout mistakes in Arabic and English text input fields.

## Overview

This extension helps users who frequently switch between Arabic and English keyboards by detecting when text is typed in the wrong keyboard layout and offering instant correction with a simple click.

## Features

- **Real-time Detection**: Automatically detects wrong keyboard layout while typing
- **Hover-to-Correct**: Shows correction tooltip when hovering over incorrectly typed words
- **Click-to-Replace**: One-click word replacement functionality
- **Multi-word Support**: Handles multiple incorrect words independently
- **Smart Positioning**: Tooltip appears directly above the incorrect word
- **Non-intrusive**: Only appears when needed, disappears after correction

## How It Works

### Detection Conditions
The floating tooltip appears only when **both** conditions are met:
1. **Wrong word detected** - Text that needs keyboard layout conversion
2. **Cursor hovering** - Mouse cursor positioned over the incorrect word

### Supported Conversions
- **Arabic to English**: Converts Arabic characters typed on English keyboard
- **English to Arabic**: Converts English characters typed on Arabic keyboard

### Example Conversions
- `اثممخ` → `hello` (Arabic characters → English)
- `hello` → `اثممخ` (English characters → Arabic)

## Installation

1. Download or clone this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode"
4. Click "Load unpacked" and select the extension folder
5. The extension will be active on all websites

## Files Structure
