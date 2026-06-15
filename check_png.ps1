Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile('g:\paniapp\assets\images\notification-bell.png')
Write-Host "Width: $($img.Width)"
Write-Host "Height: $($img.Height)"
Write-Host "PixelFormat: $($img.PixelFormat)"

# Re-save the image as a clean PNG to fix AAPT2 compatibility
$newImg = New-Object System.Drawing.Bitmap($img)
$img.Dispose()
$newImg.Save('g:\paniapp\assets\images\notification-bell-fixed.png', [System.Drawing.Imaging.ImageFormat]::Png)
$newImg.Dispose()
Write-Host "Saved fixed image"
