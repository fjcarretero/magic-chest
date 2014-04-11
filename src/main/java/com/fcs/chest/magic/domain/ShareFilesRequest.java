package com.fcs.chest.magic.domain;

public class ShareFilesRequest {
	private String[] fileId;
	private String email;
	public String[] getFileId() {
		return fileId;
	}
	public void setFileId(String[] fileId) {
		this.fileId = fileId;
	}
	public String getEmail() {
		return email;
	}
	public void setEmail(String email) {
		this.email = email;
	}
}
