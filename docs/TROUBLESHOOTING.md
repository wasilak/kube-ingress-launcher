# Troubleshooting Guide

This guide covers common issues you might encounter with Kube Ingress Launcher and their solutions.

## Application Won't Start

**Symptoms**: Application fails to launch or crashes immediately

**Solutions**:
- Ensure Rust (1.70+) and Node.js (18+) are installed correctly
- Check that all dependencies are installed: `npm install`
- Try rebuilding: `npm run tauri build`
- Check console output for error messages: `npm run tauri dev`
- Verify Xcode Command Line Tools are installed: `xcode-select --install`

## Kubernetes Connection Fails

**Symptoms**: Error banner shows "Failed to connect to Kubernetes" or "Authentication failed"

**Solutions**:
- Verify your kubeconfig exists: `ls ~/.kube/config`
- Test cluster connectivity: `kubectl cluster-info`
- Check the active context: `kubectl config current-context`
- Ensure you have permissions to list ingresses: `kubectl get ingresses --all-namespaces`
- Try switching to a different context in Settings
- Check if your cluster credentials have expired
- Verify network connectivity to the cluster

## Global Shortcut Not Working

**Symptoms**: Pressing Cmd+Shift+K doesn't show the window

**Solutions**:
- Grant Accessibility permission in System Settings > Privacy & Security > Accessibility
- Restart the application after granting permission
- Try changing the shortcut in Settings if there's a conflict with another application
- Check if another application is using the same shortcut
- Verify the shortcut is displayed correctly in the menu bar menu
- Try using the menu bar "Show" option to verify the application is running

## No Ingresses Displayed

**Symptoms**: Window shows "No ingresses found" or empty list

**Solutions**:
- Verify ingresses exist in your cluster: `kubectl get ingresses --all-namespaces`
- Check for errors in the error banner at the top of the window
- Wait for the initial refresh to complete (may take a few seconds)
- Try manually refreshing by reopening the window
- Check if you have permissions to list ingresses in all namespaces
- Verify the correct Kubernetes context is selected in Settings

## Performance Issues

**Symptoms**: Slow search, high CPU usage, or laggy UI

**Solutions**:
- Reduce the refresh interval in Settings (increase the seconds value)
- Check the number of ingresses in your cluster (1000+ may cause slowness)
- Ensure your Kubernetes cluster is responsive
- Close and reopen the application to clear cached data
- Check system resources (CPU, memory) using Activity Monitor
- Verify network latency to your Kubernetes cluster

## Window Doesn't Hide

**Symptoms**: Window stays visible after pressing Escape or clicking away

**Solutions**:
- Try pressing Escape again
- Use the global shortcut (Cmd+Shift+K) to toggle the window
- Click the menu bar icon and select "Show" to toggle
- Restart the application if the issue persists

## Settings Not Persisting

**Symptoms**: Settings reset after restarting the application

**Solutions**:
- Check file permissions in `~/Library/Application Support/kube-ingress-launcher/`
- Verify the application has write permissions
- Try manually deleting the settings file and reconfiguring
- Check console logs for storage errors

## Autostart Not Working

**Symptoms**: Application doesn't launch at login

**Solutions**:
- Verify autostart is enabled in Settings
- Check System Settings > General > Login Items
- Manually add the application to Login Items if needed
- Restart your Mac to test
- Check if macOS security settings are blocking the autostart

## Build Errors

**Symptoms**: `npm run tauri build` fails with errors

**Solutions**:
- Ensure all dependencies are up to date: `npm install && cd src-tauri && cargo update`
- Clear build cache: `rm -rf node_modules dist src-tauri/target && npm install`
- Check Rust version: `rustc --version` (should be 1.70+)
- Check Node.js version: `node --version` (should be 18+)
- Verify Xcode Command Line Tools: `xcode-select -p`
- Check for disk space issues

## Error: "Kubeconfig not found or invalid"

**Symptoms**: Application shows kubeconfig error on startup

**Solutions**:
- Verify kubeconfig file exists: `ls -la ~/.kube/config`
- Check kubeconfig is valid YAML: `kubectl config view`
- Set KUBECONFIG environment variable if using custom location
- Ensure file has correct permissions: `chmod 600 ~/.kube/config`
- Try running `kubectl get nodes` to verify kubectl works

## High Memory Usage

**Symptoms**: Application uses excessive memory (>200MB)

**Solutions**:
- This may be normal with large numbers of ingresses (1000+)
- Restart the application to clear cached data
- Reduce refresh frequency to minimize memory churn
- Check for memory leaks by monitoring over time
- Report issue if memory grows continuously without bound

## Still Having Issues?

If you're still experiencing problems after trying these solutions:

1. Check the [GitHub Issues](https://github.com/wasilak/kube-ingress-launcher/issues) to see if others have reported similar problems
2. Open a new issue with:
   - Your macOS version
   - Application version (from Settings dialog)
   - Steps to reproduce the problem
   - Any error messages or logs
   - Screenshots if applicable

## Additional Resources

- [Gatekeeper Bypass Guide](GATEKEEPER_BYPASS.md) - Detailed instructions for bypassing macOS security warnings
- [Homebrew Tap Setup](HOMEBREW_TAP_SETUP.md) - Instructions for setting up the Homebrew tap
- [Main README](../README.md) - General documentation and usage instructions
