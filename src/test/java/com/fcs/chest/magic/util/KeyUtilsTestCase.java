package com.fcs.chest.magic.util;

import static org.junit.Assert.*;

import java.security.Key;
import java.security.NoSuchAlgorithmException;

import org.apache.commons.codec.binary.Hex;
import org.junit.Test;

import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;

public class KeyUtilsTestCase {

	@Test
	public void testGenerateKey() throws NoSuchAlgorithmException {
		System.out.println(Hex.encodeHex(KeyUtils.generateKey().getEncoded()));
	}
	
	@Test
	public void testCreateEncryptorHelper() throws Exception {
		String keyStr = "964527671e85c79eac4ef2048ee43946";
		
		Key key = KeyUtils.generateKeyFromString(keyStr);
		
		EncryptorHelper eh = KeyUtils.createEncryptorHelper(key, "8888888888888888");
		byte[] iv = eh.getEncryptor().getIV();
		String msg = eh.encrypt("Hello World!");
		System.out.println(msg);
		
		DecryptorHelper dh = KeyUtils.createDecryptorHelper(key, "8888888888888888");
		assertTrue(dh.decrypt(msg).equals("Hello World!"));
	}
	
}
