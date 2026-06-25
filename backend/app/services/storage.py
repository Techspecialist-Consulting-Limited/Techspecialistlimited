import os
import uuid

from fastapi import UploadFile

from app.config import settings


async def upload_file(
    file: UploadFile, container_name: str, content: bytes | None = None
) -> str:
    if content is None:
        content = await file.read()
    filename = f"{uuid.uuid4()}.{file.filename.split('.')[-1] if file.filename else 'bin'}"

    if settings.dev_mode or not settings.azure_storage_connection_string:
        storage_dir = os.path.join("storage", container_name)
        os.makedirs(storage_dir, exist_ok=True)
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(content)
        return f"file://{filepath}"

    from azure.storage.blob.aio import BlobServiceClient
    service = BlobServiceClient.from_connection_string(
        settings.azure_storage_connection_string
    )
    container = service.get_container_client(container_name)
    async with container:
        await container.upload_blob(name=filename, data=content, overwrite=True)
        return f"{container.url}/{filename}"


async def upload_bytes(data: bytes, container_name: str, extension: str = "webm") -> str:
    filename = f"{uuid.uuid4()}.{extension}"

    if settings.dev_mode or not settings.azure_storage_connection_string:
        storage_dir = os.path.join("storage", container_name)
        os.makedirs(storage_dir, exist_ok=True)
        filepath = os.path.join(storage_dir, filename)
        with open(filepath, "wb") as f:
            f.write(data)
        return f"file://{filepath}"

    from azure.storage.blob.aio import BlobServiceClient
    service = BlobServiceClient.from_connection_string(
        settings.azure_storage_connection_string
    )
    container = service.get_container_client(container_name)
    async with container:
        await container.upload_blob(name=filename, data=data, overwrite=True)
        return f"{container.url}/{filename}"
