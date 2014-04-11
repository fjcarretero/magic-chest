package com.fcs.chest.magic.cipher;

import java.io.IOException;
import java.io.OutputStream;
import java.io.UnsupportedEncodingException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.CipherOutputStream;
import javax.crypto.IllegalBlockSizeException;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.springframework.beans.factory.InitializingBean;

public class DecryptorHelper implements InitializingBean{

	private Cipher decryptor;
	private CipherOutputStream cos;
	
	@Override
	public void afterPropertiesSet() throws Exception {
		if (decryptor == null){
			throw new RuntimeException("Decryptor cannot be null");
		}
	}

	public CipherOutputStream getCipherOutputStream(OutputStream os){
		cos =  new CipherOutputStream(os, decryptor);
		return cos;
	}
	
	public String decrypt(String text) throws DecoderException, IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		byte[] hexByte = Hex.decodeHex(text.toCharArray());
		byte[] decByte = decryptor.doFinal(hexByte);
		return new String(decByte, "UTF8");
	}

	public Cipher getDecryptor() {
		return decryptor;
	}

	public void setDecryptor(Cipher decryptor) {
		this.decryptor = decryptor;
	}
	
	public void close() throws IOException{
		if (cos != null) {
			cos.close();
		}
	}
}
