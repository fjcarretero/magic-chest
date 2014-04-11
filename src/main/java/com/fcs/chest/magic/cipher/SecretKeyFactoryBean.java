package com.fcs.chest.magic.cipher;

import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.interfaces.RSAPrivateKey;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.util.StringUtils;

public class SecretKeyFactoryBean implements FactoryBean, InitializingBean{

	private SecretKey secretKey;
	private KeyStore keyStore;
	private String secretKeyAlias;
	private String secretKeyPassword;
	
	public void afterPropertiesSet() throws Exception {
		if (keyStore == null)
			throw new RuntimeException("KeyStore can not be null");
		if (!StringUtils.hasLength(secretKeyAlias))
			throw new RuntimeException("Private key alias can not be empty");
		if (!StringUtils.hasLength(secretKeyPassword))
			throw new RuntimeException("Secret key password can not be empty");
		secretKey = (SecretKey)keyStore.getKey(secretKeyAlias, secretKeyPassword.toCharArray());
	}
	
    public Object getObject() throws Exception {
        return secretKey;
    }

    public Class getObjectType() {
        return SecretKey.class;
    }

    public boolean isSingleton() {
        return true;
    }

	public KeyStore getKeyStore() {
		return keyStore;
	}

	public void setKeyStore(KeyStore keyStore) {
		this.keyStore = keyStore;
	}

	public String getPrivateKeyAlias() {
		return secretKeyAlias;
	}

	public void setPrivateKeyAlias(String privateKeyAlias) {
		this.secretKeyAlias = privateKeyAlias;
	}

	public String getPrivateKeyPassword() {
		return secretKeyPassword;
	}

	public void setPrivateKeyPassword(String privateKeyPassword) {
		this.secretKeyPassword = privateKeyPassword;
	}

}
