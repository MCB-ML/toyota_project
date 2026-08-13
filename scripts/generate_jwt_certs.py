import argparse
from pathlib import Path

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate local RS256 JWT keypair")
    parser.add_argument("output_dir", help="Directory that will contain private.pem and public.pem")
    parser.add_argument("--force", action="store_true", help="Overwrite existing key files")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    private_path = output_dir / "private.pem"
    public_path = output_dir / "public.pem"
    output_dir.mkdir(parents=True, exist_ok=True)

    if not args.force and private_path.exists() and public_path.exists():
        print(f"JWT certs already exist in {output_dir}")
        return 0

    key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
    private_bytes = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption(),
    )
    public_bytes = key.public_key().public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo,
    )

    private_path.write_bytes(private_bytes)
    public_path.write_bytes(public_bytes)
    print(f"Generated JWT certs in {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())