#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$APP_DIR"

PKG_NAME="remix-evo"
PKG_VERSION="0.2.0"
PKG_ARCH="amd64"
DEB_NAME="${PKG_NAME}_${PKG_VERSION}_${PKG_ARCH}.deb"
OUTPUT_DEB="$APP_DIR/${DEB_NAME}"
NODE_VERSION="v22.22.2"
BUILD_DIR="$(mktemp -d -t remix-evo-build-XXXXXX)"

cleanup() {
  rm -rf "$BUILD_DIR"
}
trap cleanup EXIT

echo "=== Building Remix Evo V2 Chromebook Debian Package ==="

# 1. Build frontend
echo "Building Vite frontend..."
npx vite build

# 2. Bundle server and preflight with esbuild
echo "Bundling server.ts and preflight.ts..."
npx esbuild server.ts --bundle --platform=node --format=cjs --target=node22 --external:vite --sourcemap --outfile=dist/server.cjs
npx esbuild server/evolution/preflight.ts --bundle --platform=node --format=cjs --target=node22 --outfile=dist/preflight.cjs

# 3. Locate or download Node binary
PKG_ROOT="$BUILD_DIR/pkg"
mkdir -p "$PKG_ROOT/DEBIAN"
mkdir -p "$PKG_ROOT/opt/remix-evo/node/bin"
if [ -x "/usr/local/bin/node" ]; then
  echo "Using system Node.js binary (/usr/local/bin/node)..."
  install -m 755 "/usr/local/bin/node" "$PKG_ROOT/opt/remix-evo/node/bin/node"
elif command -v node >/dev/null 2>&1; then
  NODE_PATH="$(command -v node)"
  echo "Using system Node.js binary (${NODE_PATH})..."
  install -m 755 "$NODE_PATH" "$PKG_ROOT/opt/remix-evo/node/bin/node"
else
  NODE_TAR="node-${NODE_VERSION}-linux-x64.tar.gz"
  CACHE_DIR="${HOME}/.cache/remix-evo-build"
  mkdir -p "$CACHE_DIR"
  if [ ! -f "$CACHE_DIR/$NODE_TAR" ]; then
    echo "Downloading Node.js ${NODE_VERSION} (.tar.gz)..."
    curl -fsSL "https://nodejs.org/dist/${NODE_VERSION}/${NODE_TAR}" -o "$CACHE_DIR/$NODE_TAR"
  fi
  echo "Extracting Node.js binary..."
  mkdir -p "$BUILD_DIR/node-extracted"
  tar -xzf "$CACHE_DIR/$NODE_TAR" -C "$BUILD_DIR/node-extracted" --strip-components=1
  install -m 755 "$BUILD_DIR/node-extracted/bin/node" "$PKG_ROOT/opt/remix-evo/node/bin/node"
fi
mkdir -p "$PKG_ROOT/opt/remix-evo/bin"
mkdir -p "$PKG_ROOT/usr/bin"
mkdir -p "$PKG_ROOT/usr/local/bin"
mkdir -p "$PKG_ROOT/opt/remix-evo/app"
mkdir -p "$PKG_ROOT/usr/share/applications"
mkdir -p "$PKG_ROOT/usr/share/icons/hicolor/48x48/apps"
mkdir -p "$PKG_ROOT/usr/share/icons/hicolor/128x128/apps"
mkdir -p "$PKG_ROOT/usr/share/icons/hicolor/256x256/apps"

# Copy app code (dist, agent, server.cjs, preflight.cjs)
cp -r dist "$PKG_ROOT/opt/remix-evo/app/dist"
rm -f "$PKG_ROOT/opt/remix-evo/app/dist/server.cjs"*
install -m 644 dist/server.cjs "$PKG_ROOT/opt/remix-evo/app/server.cjs"
install -m 644 dist/preflight.cjs "$PKG_ROOT/opt/remix-evo/app/preflight.cjs"

if [ -d agent ]; then
  cp -r agent "$PKG_ROOT/opt/remix-evo/app/agent"
fi

# Install launcher script into /opt/remix-evo/bin, /usr/bin, and /usr/local/bin
install -m 755 packaging/chromebook/remix-evo "$PKG_ROOT/opt/remix-evo/bin/remix-evo"
install -m 755 packaging/chromebook/remix-evo "$PKG_ROOT/usr/bin/remix-evo"
install -m 755 packaging/chromebook/remix-evo "$PKG_ROOT/usr/local/bin/remix-evo"

# Install desktop files
install -m 644 packaging/chromebook/remix-evo.desktop "$PKG_ROOT/usr/share/applications/remix-evo.desktop"
install -m 644 packaging/chromebook/remix-evo-setkey.desktop "$PKG_ROOT/usr/share/applications/remix-evo-setkey.desktop"
install -m 644 packaging/chromebook/remix-evo-stop.desktop "$PKG_ROOT/usr/share/applications/remix-evo-stop.desktop"

# Install icons if present
for size in 48 128 256; do
  ICON_FILE="packaging/chromebook/icon-${size}.png"
  if [ -f "$ICON_FILE" ]; then
    install -m 644 "$ICON_FILE" "$PKG_ROOT/usr/share/icons/hicolor/${size}x${size}/apps/remix-evo.png"
  fi
done

# 5. Maintainer scripts and control file
cat <<EOF > "$PKG_ROOT/DEBIAN/control"
Package: ${PKG_NAME}
Version: ${PKG_VERSION}
Section: devel
Priority: optional
Architecture: ${PKG_ARCH}
Depends: libc6 (>= 2.28)
Recommends: ca-certificates, libstdc++6
Maintainer: Remix Evo Team <sleeves@remix-evo.local>
Description: Autonomous Multi-Agent Financial Research Evolution Engine
 Evolves agent skill genomes against adversarial financial scenarios.
EOF

cat <<'EOF' > "$PKG_ROOT/DEBIAN/postinst"
#!/bin/sh
set -e
mkdir -p /usr/bin /usr/local/bin
chmod 755 /opt/remix-evo/bin/remix-evo 2>/dev/null || true
ln -sf /opt/remix-evo/bin/remix-evo /usr/bin/remix-evo
ln -sf /opt/remix-evo/bin/remix-evo /usr/local/bin/remix-evo
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications || true
fi
if command -v gtk-update-icon-cache >/dev/null 2>&1; then
  gtk-update-icon-cache -q -t -f /usr/share/icons/hicolor || true
fi
EOF
chmod 755 "$PKG_ROOT/DEBIAN/postinst"

cat <<'EOF' > "$PKG_ROOT/DEBIAN/prerm"
#!/bin/sh
set -e
pkill -f '^/opt/remix-evo/node/bin/node /opt/remix-evo/app/server\.cjs$' || true
EOF
chmod 755 "$PKG_ROOT/DEBIAN/prerm"

cat <<'EOF' > "$PKG_ROOT/DEBIAN/postrm"
#!/bin/sh
set -e
rm -f /usr/bin/remix-evo /usr/local/bin/remix-evo
if [ "$1" = "purge" ]; then
  rm -rf /opt/remix-evo
fi
if command -v update-desktop-database >/dev/null 2>&1; then
  update-desktop-database -q /usr/share/applications || true
fi
EOF
chmod 755 "$PKG_ROOT/DEBIAN/postrm"

# Calculate Installed-Size
INSTALLED_SIZE=$(du -sk "$PKG_ROOT" | awk '{print $1}')
echo "Installed-Size: $INSTALLED_SIZE" >> "$PKG_ROOT/DEBIAN/control"

# 6. Build .deb package
echo "Packaging into ${OUTPUT_DEB}..."
dpkg-deb --build --root-owner-group -Zgzip "$PKG_ROOT" "$OUTPUT_DEB"
mkdir -p "$APP_DIR/dist"
cp -f "$OUTPUT_DEB" "$APP_DIR/dist/${DEB_NAME}"
echo "Successfully built ${OUTPUT_DEB} and copied to dist/${DEB_NAME}."
