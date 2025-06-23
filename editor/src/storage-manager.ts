let accessToken: string;

export async function uploadFile(resource: string, file: Blob | string): Promise<string> {
    await updateAccessToken();
    try {
        await deleteFile(resource); // Ensure the file is deleted before uploading a new one
    } catch (error) {
        console.log("Unable to delete file, continuing: ", error);
    }
    const headersList = {
        "Accept": "*/*",
        "Authorization": `Bearer ${accessToken}`
    };

    const bodyContent = new FormData();
    bodyContent.append("resource", resource);
    bodyContent.append("file", file);

    const response = await fetch(`${process.env.API_URL}/upload_data_on_minio/`, {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    return await response.text();
}

export async function getFile(resource: string): Promise<Blob> {
    await updateAccessToken();
    const headersList = {
        "Accept": "*/*",
        "Authorization": `Bearer ${accessToken}`        
    };

    const response = await fetch(
        `${process.env.API_URL}/get_data_from_minio/?resource=${encodeURIComponent(resource)}`,
        {
            method: "GET",
            headers: headersList
        }
    );

    return await response.blob();
}

export async function deleteFile(resource: string): Promise<string> {
    await updateAccessToken();
    const headersList = {
        "Accept": "*/*",
        "Authorization": `Bearer ${accessToken}`
    };

    const bodyContent = new FormData();
    bodyContent.append("resource", resource);

    const response = await fetch(`${process.env.API_URL}/delete_data_on_minio/`, {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    return await response.text();
}

async function updateAccessToken(): Promise<void> {
    const headersList = {
        "Accept": "*/*",
        "Content-Type": "application/json"
    };

    const bodyContent = JSON.stringify({
        "username": process.env.XRTWINSCAPEUSERNAME,
        "password": process.env.XRTWINSCAPEPASSWORD
    });

    const response = await fetch(`${process.env.API_URL}/api/token/`, {
        method: "POST",
        body: bodyContent,
        headers: headersList
    });

    const data = await response.json();
    accessToken = data.access;
    console.log("Access token updated:", accessToken);
}

export {updateAccessToken, accessToken}