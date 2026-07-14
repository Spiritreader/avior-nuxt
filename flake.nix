{
  description = "avior-nuxt — Vite + Vue 3 + Vuetify 4 SPA with an Express API server";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-utils.url = "github:numtide/flake-utils";
  };

  outputs =
    { self, nixpkgs, flake-utils }:
    flake-utils.lib.eachDefaultSystem (
      system:
      let
        pkgs = import nixpkgs { inherit system; };

        # engines.node is ">=20.19"; nodejs_22 is the current LTS that satisfies it.
        nodejs = pkgs.nodejs_22;
        # package.json pins pnpm@11.12.0. nixpkgs `pnpm` may be a different patch,
        # but it reads the same lockfileVersion 9 lockfile. Swap to pkgs.pnpm_10 /
        # pkgs.pnpm_9 if you need a specific major.
        pnpm = pkgs.pnpm;

        pname = "avior-nuxt";
        version = "1.0.0";

        # Static SPA build (the contents of dist/). This does NOT bundle the
        # Express server or its node_modules — to serve in production you also
        # need `server/` and a `pnpm install --prod` alongside this dist/.
        spa = pkgs.stdenv.mkDerivation (finalAttrs: {
          inherit pname version;
          src = ./.;

          nativeBuildInputs = [
            nodejs
            pnpm.configHook
          ];

          # Content-addressed pnpm store for offline, reproducible installs.
          # Placeholder hash: run `nix build`, paste the hash Nix reports. Update
          # it whenever pnpm-lock.yaml changes. If your nixpkgs errors about
          # `fetcherVersion`, adjust or drop that line to match its pnpm API.
          pnpmDeps = pnpm.fetchDeps {
            inherit (finalAttrs) pname version src;
            fetcherVersion = 2;
            hash = pkgs.lib.fakeHash;
          };

          buildPhase = ''
            runHook preBuild
            pnpm build
            runHook postBuild
          '';

          installPhase = ''
            runHook preInstall
            cp -r dist "$out"
            runHook postInstall
          '';

          meta.description = "Built avior-nuxt single-page app (dist/)";
        });
      in
      {
        packages = {
          default = spa;
          avior-nuxt = spa;
        };

        devShells.default = pkgs.mkShell {
          packages = [
            nodejs
            pnpm
          ];

          shellHook = ''
            export MONGO_URL="''${MONGO_URL:-mongodb://192.168.178.75:27017/Avior}"
            echo "avior-nuxt dev shell — node $(node --version), pnpm $(pnpm --version)"
            echo "  pnpm install"
            echo "  pnpm dev:api   # Express API + Mongoose on :10009 (MONGO_URL=$MONGO_URL)"
            echo "  pnpm dev       # Vite dev server on :5173, proxies /api to :10009"
            echo "  pnpm build     # production SPA into dist/"
          '';
        };

        formatter = pkgs.nixfmt-rfc-style;
      }
    );
}
