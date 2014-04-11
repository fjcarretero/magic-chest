package com.fcs.chest.magic.domain;

import com.google.api.client.googleapis.media.MediaHttpUploader.UploadState;

public class State {
	public State(UploadState state, double progress) {
		super();
		this.state = state;
		this.progress = progress;
	}
	private UploadState state;
	
	private double progress;
	public UploadState getState() {
		return state;
	}
	public void setState(UploadState state) {
		this.state = state;
	}
	public double getProgress() {
		return progress;
	}
	public void setProgress(double progress) {
		this.progress = progress;
	}
}
