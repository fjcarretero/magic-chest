package com.fcs.chest.magic.cipher;

import java.security.KeyStore;
import java.security.PrivateKey;
import java.security.interfaces.RSAPrivateKey;

import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.util.StringUtils;

public class PrivateKeyFactoryBean implements FactoryBean, InitializingBean{

	private PrivateKey privateKey;
	private KeyStore keyStore;
	private String privateKeyAlias;
	private String privateKeyPassword;
	
	public void afterPropertiesSet() throws Exception {
		if (keyStore == null)
			throw new RuntimeException("KeyStore can not be null");
		if (!StringUtils.hasLength(privateKeyAlias))
			throw new RuntimeException("Private key alias can not be empty");
		if (!StringUtils.hasLength(privateKeyPassword))
			throw new RuntimeException("Private key password can not be empty");
		privateKey = (RSAPrivateKey)keyStore.getKey(privateKeyAlias, privateKeyPassword.toCharArray());
	}
	
    public Object getObject() throws Exception {
        return privateKey;
    }

    public Class getObjectType() {
        return PrivateKey.class;
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
		return privateKeyAlias;
	}

	public void setPrivateKeyAlias(String privateKeyAlias) {
		this.privateKeyAlias = privateKeyAlias;
	}

	public String getPrivateKeyPassword() {
		return privateKeyPassword;
	}

	public void setPrivateKeyPassword(String privateKeyPassword) {
		this.privateKeyPassword = privateKeyPassword;
	}

}
