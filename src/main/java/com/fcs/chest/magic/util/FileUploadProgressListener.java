package com.fcs.chest.magic.util;

import java.io.IOException;

import javax.servlet.http.HttpSession;

import com.fcs.chest.magic.domain.State;
import com.google.api.client.googleapis.media.MediaHttpUploader;
import com.google.api.client.googleapis.media.MediaHttpUploaderProgressListener;

public class FileUploadProgressListener implements
		MediaHttpUploaderProgressListener {

	public FileUploadProgressListener(HttpSession session) {
		super();
		this.session = session;
	}

	private HttpSession session;
	
	public void progressChanged(MediaHttpUploader uploader) throws IOException {
		session.setAttribute("uploadState", new State(uploader.getUploadState(), uploader.getProgress()));
		/*
		switch (uploader.getUploadState()) {
		case INITIATION_STARTED:
			System.out.println("Initiation Started");
			break;
		case INITIATION_COMPLETE:
			System.out.println("Initiation Completed");
			break;
		case MEDIA_IN_PROGRESS:
			System.out.println("Upload percentage: " + uploader.getProgress());
			break;
		case MEDIA_COMPLETE:
			System.out.println("Upload Completed!");
			break;

		case NOT_STARTED:
			System.out.println("Not Started!");
			break;
		}
		*/
	}
}
