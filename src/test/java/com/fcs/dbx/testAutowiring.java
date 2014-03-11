package com.fcs.dbx;

import static org.junit.Assert.*;

import java.io.UnsupportedEncodingException;

import javax.crypto.BadPaddingException;
import javax.crypto.Cipher;
import javax.crypto.IllegalBlockSizeException;

import org.apache.commons.codec.DecoderException;
import org.apache.commons.codec.binary.Hex;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.AbstractJUnit4SpringContextTests;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={"classpath:applicationContext.xml"})
public class testAutowiring extends AbstractJUnit4SpringContextTests {

	 @Autowired
	 private Cipher encryptor;
	 
	 @Autowired
	 private Cipher decryptor;
	
	@Test public void testAll() throws IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException, DecoderException{
		String tst = "pepito";
		byte[] encByte = encryptor.doFinal(tst.getBytes("UTF8"));
		String hexString = new String(Hex.encodeHex(encByte));
		byte[] hexByte = Hex.decodeHex(hexString.toCharArray());
		byte[] decByte = decryptor.doFinal(hexByte);
		String decString = new String(decByte, "UTF8");
		assertEquals(tst, decString);
	}
	
	@Test public void testDec() throws DecoderException, IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		String tst = "clantve.py";
		String hexString = "7a4a48c95c9789964ab83036f8155aca";
		byte[] hexByte = Hex.decodeHex(hexString.toCharArray());
		byte[] decByte = decryptor.doFinal(hexByte);
		String decString = new String(decByte, "UTF8");
		assertEquals(tst, decString);
	}
	
	@Test public void testEnc() throws IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		String tst = "clantve.py";
		String out = "7a4a48c95c9789964ab83036f8155aca";
		byte[] encByte = encryptor.doFinal(tst.getBytes("UTF8"));
		String hexString = new String(Hex.encodeHex(encByte));
		assertEquals(out, hexString);
	}
}
