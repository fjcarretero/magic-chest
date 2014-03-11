package com.fcs.chest.magic.util;

import java.io.IOException;

import javax.crypto.CipherInputStream;
import javax.servlet.http.HttpSession;

import com.google.api.client.googleapis.media.MediaHttpUploader;
import com.google.api.services.drive.Drive.Files.Insert;

public class WorkingTask implements Runnable {

	private Insert insert;
	private HttpSession session;
	private CipherInputStream cis;
	
	@Override
	public void run() {
		MediaHttpUploader uploader = insert.getMediaHttpUploader();
		uploader.setProgressListener(new FileUploadProgressListener(session));
		uploader.setDirectUploadEnabled(false);//file.getSize() <= 5 * 1024 * 1024);
		//System.out.println(uploader.getChunkSize());
		try {
			com.google.api.services.drive.model.File guf = insert.execute();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if (cis != null) {
				try {
					cis.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}
//		uf.setDownloadUrl(URLEncoder.encode(guf.getDownloadUrl(), "UTF-8"));
//		uf.setId(guf.getId());		
//		uf.setOwner(guf.getOwners());
//		uf.setPermissionId(guf.getOwners().get(0).getPermissionId());
		
	}

	public Insert getInsert() {
		return insert;
	}

	public void setInsert(Insert insert) {
		this.insert = insert;
	}

	public HttpSession getSession() {
		return session;
	}

	public void setSession(HttpSession session) {
		this.session = session;
	}

	public CipherInputStream getCis() {
		return cis;
	}

	public void setCis(CipherInputStream cis) {
		this.cis = cis;
	}

}
