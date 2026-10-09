# Release procedure

1. Pull main. Make changes on an isolated branch/worktree; write failing boundary tests first.
2. Run `npm ci --ignore-scripts` and `npm run check` from a clean checkout. Use `git config core.hooksPath .githooks` for the committed pre-push gate.
3. Review metadata, copyright, privacy and capability claims. Update CHANGELOG/version/assets together. Do not advertise fictional model access or copied upstream rankings.
4. Open a PR and require the aggregate `ci-success` check before merge. The public repository uses GitHub-hosted Linux/macOS CI, not private infrastructure-specific hooks.
5. Merge to main, pull the result, delete the branch and remove the worktree.
6. Create an annotated `v<version>` tag at the verified main commit. Push tag, `npm pack --ignore-scripts`, generate SHA-256 checksums and create a GitHub release with the package and launch PNGs.
7. Smoke-test `pi install git:github.com/chengyixu/pi-our-free-model@v<version>` using a temporary Pi agent directory. Never modify the operator's global defaults merely to test installation.
8. Check the public README and release. Upload the social card through GitHub Settings → General → Social preview and verify the saved preview. Committing the image is not equivalent to setting it.

Git installation is the supported distribution. Do not claim npm publication without actually publishing and validating it.
