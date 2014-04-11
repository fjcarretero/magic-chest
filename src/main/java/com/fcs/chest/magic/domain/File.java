package com.fcs.chest.magic.domain;

import java.util.List;

import com.google.api.services.drive.model.User;

public class File {
	
	private String name;
	private String type;
	private String documentType;
	private String cipheredName;
	private String downloadUrl;
	private String id;
	private String permissionId;
	private List<User> owner;
	
	public String getName() {
		return name;
	}
	public void setName(String name) {
		this.name = name;
	}
	public String getType() {
		return type;
	}
	public void setType(String type) {
		this.type = type;
	}
	public String getDocumentType() {
		return documentType;
	}
	public void setDocumentType(String documentType) {
		this.documentType = documentType;
	}
	public String getCipheredName() {
		return cipheredName;
	}
	public void setCipheredName(String cipheredName) {
		this.cipheredName = cipheredName;
	}
	public String getDownloadUrl() {
		return downloadUrl;
	}
	public void setDownloadUrl(String downloadUrl) {
		this.downloadUrl = downloadUrl;
	}
	public String getId() {
		return id;
	}
	public void setId(String id) {
		this.id = id;
	}
	public List<User> getOwner() {
		return owner;
	}
	public void setOwner(List<User> owner) {
		this.owner = owner;
	}
	public String getPermissionId() {
		return permissionId;
	}
	public void setPermissionId(String permissionId) {
		this.permissionId = permissionId;
	}
}
