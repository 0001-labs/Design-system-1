#!/bin/sh
# Runs the Kotlin package's Gradle build in native/android with a JDK and the Android SDK found
# on this Mac: JAVA_HOME and ANDROID_HOME when set, otherwise Homebrew's OpenJDK 21 and
# Android command-line tools, or Android Studio's.
set -e
cd "$(dirname "$0")/../native/android"
if [ -z "$JAVA_HOME" ]; then
  for home in /opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home "/Applications/Android Studio.app/Contents/jbr/Contents/Home"; do
    [ -x "$home/bin/java" ] && JAVA_HOME="$home" && break
  done
  export JAVA_HOME
fi
if [ -z "$ANDROID_HOME" ] && [ ! -f local.properties ]; then
  for sdk in /opt/homebrew/share/android-commandlinetools "$HOME/Library/Android/sdk"; do
    [ -d "$sdk/platforms" ] && ANDROID_HOME="$sdk" && break
  done
  export ANDROID_HOME
fi
exec ./gradlew --console=plain "$@"
