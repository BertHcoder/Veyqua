<#
  Generates the favicon, PWA icons, Apple touch icon and social preview image
  from branding/veyqua-logo.png. Windows only (uses System.Drawing).

  Usage: powershell -ExecutionPolicy Bypass -File scripts/make-icons.ps1
#>
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $PSScriptRoot
$source = Join-Path $root 'branding\veyqua-logo.png'
$public = Join-Path $root 'public'
$icons = Join-Path $public 'icons'
New-Item -ItemType Directory -Force -Path $icons | Out-Null

$navy = [System.Drawing.Color]::FromArgb(255, 1, 23, 64)
$png = [System.Drawing.Imaging.ImageFormat]::Png
$argb = [System.Drawing.Imaging.PixelFormat]::Format32bppArgb

function New-Graphics([System.Drawing.Bitmap]$bmp) {
  $g = [System.Drawing.Graphics]::FromImage($bmp)
  $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
  $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
  $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
  $g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::AntiAliasGridFit
  return $g
}

function New-RoundedPath([float]$x, [float]$y, [float]$w, [float]$h, [float]$r) {
  $path = New-Object System.Drawing.Drawing2D.GraphicsPath
  $d = $r * 2
  $path.AddArc($x, $y, $d, $d, 180, 90)
  $path.AddArc($x + $w - $d, $y, $d, $d, 270, 90)
  $path.AddArc($x + $w - $d, $y + $h - $d, $d, $d, 0, 90)
  $path.AddArc($x, $y + $h - $d, $d, $d, 90, 90)
  $path.CloseFigure()
  return $path
}

# Draws $img scaled into a rectangle without edge bleeding.
function Draw-Scaled([System.Drawing.Graphics]$g, [System.Drawing.Image]$img, [float]$x, [float]$y, [float]$w, [float]$h) {
  $attrs = New-Object System.Drawing.Imaging.ImageAttributes
  $attrs.SetWrapMode([System.Drawing.Drawing2D.WrapMode]::TileFlipXY)
  $dest = New-Object System.Drawing.Rectangle ([int][Math]::Round($x)), ([int][Math]::Round($y)), ([int][Math]::Round($w)), ([int][Math]::Round($h))
  $g.DrawImage($img, $dest, 0, 0, $img.Width, $img.Height, [System.Drawing.GraphicsUnit]::Pixel, $attrs)
  $attrs.Dispose()
}

# 1. Full-bleed master: the source has white rounded corners; repaint them navy.
$src = [System.Drawing.Bitmap]::FromFile($source)
$size = $src.Width
$full = New-Object System.Drawing.Bitmap $size, $size, $argb
$g = New-Graphics $full
$g.Clear($navy)
$g.DrawImage($src, 0, 0, $size, $size)
$brush = New-Object System.Drawing.SolidBrush $navy
$zone = [int]($size * 0.22)
foreach ($corner in @(@(0, 0), @(($size - $zone), 0), @(0, ($size - $zone)), @(($size - $zone), ($size - $zone)))) {
  $g.FillRectangle($brush, $corner[0], $corner[1], $zone, $zone)
}
$g.Dispose()
$src.Dispose()

# Square icon with navy background; $scale < 1 adds padding (maskable safe zone).
function Save-Square([int]$px, [string]$path, [double]$scale = 1.0) {
  $bmp = New-Object System.Drawing.Bitmap $px, $px, $argb
  $g = New-Graphics $bmp
  $g.Clear($navy)
  $inner = $px * $scale
  $offset = ($px - $inner) / 2
  Draw-Scaled $g $full $offset $offset $inner $inner
  $g.Dispose()
  $bmp.Save($path, $png)
  $bmp.Dispose()
}

# Rounded-square icon with transparent corners.
function New-Rounded([int]$px) {
  $scaled = New-Object System.Drawing.Bitmap $px, $px, $argb
  $g = New-Graphics $scaled
  Draw-Scaled $g $full 0 0 $px $px
  $g.Dispose()
  $bmp = New-Object System.Drawing.Bitmap $px, $px, $argb
  $g = New-Graphics $bmp
  $g.Clear([System.Drawing.Color]::Transparent)
  $texture = New-Object System.Drawing.TextureBrush $scaled
  $path = New-RoundedPath 0 0 $px $px ($px * 0.22)
  $g.FillPath($texture, $path)
  $texture.Dispose(); $path.Dispose(); $g.Dispose(); $scaled.Dispose()
  return $bmp
}

function Save-Rounded([int]$px, [string]$path) {
  $bmp = New-Rounded $px
  $bmp.Save($path, $png)
  $bmp.Dispose()
}

Save-Rounded 512 (Join-Path $icons 'icon-512.png')
Save-Rounded 192 (Join-Path $icons 'icon-192.png')
Save-Rounded 96 (Join-Path $icons 'icon-96.png')
Save-Square 512 (Join-Path $icons 'maskable-512.png') 0.82
Save-Square 180 (Join-Path $public 'apple-touch-icon.png')

# 2. favicon.ico with embedded PNG frames (16, 32, 48).
$frames = @()
foreach ($px in 16, 32, 48) {
  $bmp = New-Rounded $px
  $ms = New-Object System.IO.MemoryStream
  $bmp.Save($ms, $png)
  $frames += , @($px, $ms.ToArray())
  $ms.Dispose(); $bmp.Dispose()
}
$ico = New-Object System.IO.MemoryStream
$w = New-Object System.IO.BinaryWriter $ico
$w.Write([UInt16]0); $w.Write([UInt16]1); $w.Write([UInt16]$frames.Count)
$offset = 6 + 16 * $frames.Count
foreach ($f in $frames) {
  $w.Write([byte]$f[0]); $w.Write([byte]$f[0]); $w.Write([byte]0); $w.Write([byte]0)
  $w.Write([UInt16]1); $w.Write([UInt16]32)
  $w.Write([UInt32]$f[1].Length); $w.Write([UInt32]$offset)
  $offset += $f[1].Length
}
foreach ($f in $frames) { $w.Write([byte[]]$f[1]) }
$w.Flush()
[System.IO.File]::WriteAllBytes((Join-Path $public 'favicon.ico'), $ico.ToArray())
$w.Dispose()

# 3. Social preview image (1200x630).
$ogW = 1200; $ogH = 630
$og = New-Object System.Drawing.Bitmap $ogW, $ogH, $argb
$g = New-Graphics $og
$bgRect = New-Object System.Drawing.Rectangle 0, 0, $ogW, $ogH
$bg = New-Object System.Drawing.Drawing2D.LinearGradientBrush $bgRect, $navy, ([System.Drawing.Color]::FromArgb(255, 6, 42, 102)), 30
$g.FillRectangle($bg, $bgRect)
$glowPath = New-Object System.Drawing.Drawing2D.GraphicsPath
$glowPath.AddEllipse(40, 55, 520, 520)
$glow = New-Object System.Drawing.Drawing2D.PathGradientBrush $glowPath
$glow.CenterColor = [System.Drawing.Color]::FromArgb(90, 53, 224, 232)
$glow.SurroundColors = @([System.Drawing.Color]::FromArgb(0, 53, 224, 232))
$g.FillPath($glow, $glowPath)
$logo = New-Rounded 340
$g.DrawImage($logo, 130, 145, 340, 340)
$logo.Dispose()
$white = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 234, 244, 255))
$muted = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 167, 187, 220))
$cyan = New-Object System.Drawing.SolidBrush ([System.Drawing.Color]::FromArgb(255, 53, 224, 232))
$titleFont = New-Object System.Drawing.Font 'Segoe UI Semibold', 88, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$tagFont = New-Object System.Drawing.Font 'Segoe UI', 34, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$urlFont = New-Object System.Drawing.Font 'Segoe UI Semibold', 28, ([System.Drawing.FontStyle]::Regular), ([System.Drawing.GraphicsUnit]::Pixel)
$g.DrawString('Veyqua', $titleFont, $white, 540, 170)
$g.DrawString("Track your aquarium water,`nspot problems early and`nget instant tips.", $tagFont, $muted, 546, 292)
$g.DrawString('veyqua.itaanhuys.com', $urlFont, $cyan, 546, 470)
$g.Dispose()
$og.Save((Join-Path $public 'og.png'), $png)
$og.Dispose()

$full.Dispose()
Get-ChildItem $public -Recurse -Include *.png, *.ico | Select-Object FullName, Length | Format-Table -AutoSize
