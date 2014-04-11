package com.fcs.chest.magic.domain;

import java.security.Key;

import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;
import com.fcs.chest.magic.util.KeyUtils;

public class CipherHelper {
	private EncryptorHelper encryptorHelper;
	private DecryptorHelper decryptorHelper;
	
	private Key key;
	
	public EncryptorHelper getEncryptorHelper() {
		return encryptorHelper;
	}
	public void setEncryptorHelper(EncryptorHelper encryptorHelper) {
		this.encryptorHelper = encryptorHelper;
	}
	public DecryptorHelper getDecryptorHelper() {
		return decryptorHelper;
	}
	public void setDecryptorHelper(DecryptorHelper decryptorHelper) {
		this.decryptorHelper = decryptorHelper;
	}
	public Key getKey() {
		return key;
	}
	public void setKey(Key key) {
		this.key = key;
	}
	public void initialize() throws Exception {
		this.decryptorHelper = KeyUtils.createDecryptorHelper(key, "8888888888888888");
		this.encryptorHelper = KeyUtils.createEncryptorHelper(key, "8888888888888888");
		
	}
}
