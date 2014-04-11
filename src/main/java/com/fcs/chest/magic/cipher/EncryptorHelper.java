package com.fcs.chest.magic.cipher;

import java.io.IOException;
import java.io.InputStream;
import java.io.UnsupportedEncodingException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.CipherInputStream;
import javax.crypto.IllegalBlockSizeException;

import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.InitializingBean;

public class EncryptorHelper implements InitializingBean{

	private Cipher encryptor;
	private CipherInputStream cis;
	
	@Override
	public void afterPropertiesSet() throws Exception {
		if (encryptor == null){
			throw new RuntimeException("Encryptor cannot be null");
		}
	}

	public Cipher getEncryptor() {
		return encryptor;
	}

	public void setEncryptor(Cipher encryptor) {
		this.encryptor = encryptor;
	}

	public CipherInputStream getCipherInputStream(InputStream is){
		cis = new CipherInputStream(is, encryptor);
		return cis;
	}
	
	public String encrypt(String text) throws IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		byte[] encByte = encryptor.doFinal(text.getBytes("UTF8"));
		return new String(Hex.encodeHex(encByte));
	}
	
	public void close() throws IOException {
		if (cis != null) {
			cis.close();
		}
	}
}
