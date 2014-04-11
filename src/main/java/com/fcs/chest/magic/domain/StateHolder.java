package com.fcs.chest.magic.domain;

import java.io.Serializable;

import org.springframework.context.annotation.Scope;
import org.springframework.context.annotation.ScopedProxyMode;
import org.springframework.stereotype.Component;

import com.google.api.client.googleapis.media.MediaHttpUploader;

@Component
@Scope(value = "session", proxyMode = ScopedProxyMode.TARGET_CLASS)
public class StateHolder implements Serializable {
	private MediaHttpUploader uploader;

	public MediaHttpUploader getUploader() {
		return uploader;
	}

	public void setUploader(MediaHttpUploader uploader) {
		this.uploader = uploader;
	}
}
