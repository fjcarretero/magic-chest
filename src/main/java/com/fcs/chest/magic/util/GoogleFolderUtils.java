package com.fcs.chest.magic.util;

import java.io.IOException;

import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.FileList;

public class GoogleFolderUtils {

	public static String getFolderId(GoogleCredential credential) throws IOException {
		HttpTransport httpTransport = new NetHttpTransport();
		JsonFactory jsonFactory = new JacksonFactory();

		Drive service = new Drive.Builder(httpTransport, jsonFactory,
				credential).build();

		FileList folders = service.files().list().setQ("title = 'magic-chest'")
				.execute();
		if (folders.getItems().size() > 0) {
			System.out.println("existe");
			return folders.getItems().get(0).getId();
		} else {
			com.google.api.services.drive.model.File f = new com.google.api.services.drive.model.File();
			f.setTitle("magic-chest");
			f.setMimeType("application/vnd.google-apps.folder");
			com.google.api.services.drive.model.File f2 = service.files()
					.insert(f).execute();
			System.out.println("no existe");
			return f2.getId();
		}

	}
}
