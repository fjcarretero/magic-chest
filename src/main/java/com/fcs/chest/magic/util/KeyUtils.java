package com.fcs.chest.magic.util;

import java.security.Key;
import java.security.NoSuchAlgorithmException;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.spec.SecretKeySpec;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;

import com.fcs.chest.magic.cipher.CipherFactoryBean;
import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;

public class KeyUtils {
	
	public static Key generateKey() throws NoSuchAlgorithmException {
		return 	KeyGenerator.getInstance("AES").generateKey();
	}
	
	public static Key generateKeyFromString(String hexString) throws DecoderException {
		byte[] encodedKey = Hex.decodeHex(hexString.toCharArray());
		return new SecretKeySpec(encodedKey, 0, encodedKey.length, "AES");
	}
	
	public static Key generateKeyFromByteArray(byte[] encodedKey) throws DecoderException {
		return new SecretKeySpec(encodedKey, 0, encodedKey.length, "AES");
	}

	public static DecryptorHelper createDecryptorHelper(Key key, String iv) throws Exception{
		CipherFactoryBean encFB = generateCipher(Cipher.DECRYPT_MODE, key, iv);
		DecryptorHelper decryptorHelper = new DecryptorHelper();
		decryptorHelper.setDecryptor((Cipher)encFB.getObject());
		
		return decryptorHelper;
	}
	
	public static EncryptorHelper createEncryptorHelper(Key key, String iv) throws Exception{
		CipherFactoryBean encFB = generateCipher(Cipher.ENCRYPT_MODE, key, iv);
		EncryptorHelper encryptorHelper = new EncryptorHelper();
		encryptorHelper.setEncryptor((Cipher)encFB.getObject());
		
		return encryptorHelper;
	}
	
	private static CipherFactoryBean generateCipher(int mode, Key key, String iv) throws Exception{
		CipherFactoryBean cfb = new CipherFactoryBean();
		cfb.setAlgorithm("AES/CBC/PKCS5Padding");
		cfb.setOperationMode(mode);
		cfb.setKey(key);
		if (iv != null){
			cfb.setInitializationVector(iv);
		}
		cfb.afterPropertiesSet();
		
		return cfb;
	}
	
}
