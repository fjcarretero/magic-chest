package com.fcs.chest.magic.domain;

import java.io.Serializable;
import java.security.Key;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import com.fcs.chest.magic.util.KeyUtils;
import com.google.api.client.googleapis.auth.oauth2.GoogleCredential;

@Component
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class DataHolder implements Serializable {
	/**
	 * 
	 */
	private static final long serialVersionUID = -363436699865672421L;
	private GoogleCredential credential;
	private Map<String, CipherHelper> cipherHelpers;
	private String permissionId;
	private List<String> sharedWith;
	private String keyFileId;
	
	public GoogleCredential getCredential() {
		return credential;
	}

	public void setCredential(GoogleCredential credential) {
		this.credential = credential;
	}

	public Map<String, CipherHelper> getCipherHelpers() {
		return cipherHelpers;
	}

	public void setCipherHelpers(Map<String, CipherHelper> cipherHelpers) {
		this.cipherHelpers = cipherHelpers;
	}

	public String getPermissionId() {
		return permissionId;
	}

	public void setPermissionId(String permissionId) {
		this.permissionId = permissionId;
	}

	public CipherHelper getUserCipherHelper() {
		return cipherHelpers.get(permissionId);
	}
	
	public void initialize() throws Exception{
		for (CipherHelper value : cipherHelpers.values()) {
			value.initialize();
		}
	}

	public List<String> getSharedWith() {
		return sharedWith;
	}

	public void setSharedWith(List<String> sharedWith) {
		this.sharedWith = sharedWith;
	}

	public String getKeyFileId() {
		return keyFileId;
	}

	public void setKeyFileId(String keyFileId) {
		this.keyFileId = keyFileId;
	}
}
