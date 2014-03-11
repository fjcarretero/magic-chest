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

import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={"classpath:applicationContext.xml"})
public class testAutowiring2 extends AbstractJUnit4SpringContextTests {

	 @Autowired
	 private EncryptorHelper encryptorHelper;
	 
	 @Autowired
	 private DecryptorHelper decryptorHelper;
	
	@Test public void testAll() throws IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException, DecoderException{
		String tst = "pepito";
		String encString = encryptorHelper.encrypt(tst);
		String decString = decryptorHelper.decrypt(encString);
		assertEquals(tst, decString);
	}
	
	@Test public void testDec() throws DecoderException, IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		String tst = "clantve.py";
		String hexString = "7a4a48c95c9789964ab83036f8155aca";
		String decString = decryptorHelper.decrypt(hexString);
		assertEquals(tst, decString);
	}
	
	@Test public void testEnc() throws IllegalBlockSizeException, BadPaddingException, UnsupportedEncodingException {
		String tst = "clantve.py";
		String out = "7a4a48c95c9789964ab83036f8155aca";
		String hexString = encryptorHelper.encrypt(tst);
		assertEquals(out, hexString);
	}
}
