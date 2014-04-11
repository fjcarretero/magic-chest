package com.fcs.chest.magic.cipher;

import java.security.Key;
import java.security.Provider;
import java.security.Security;

import javax.crypto.Cipher;
import javax.crypto.spec.IvParameterSpec;

import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.util.StringUtils;

public class CipherFactoryBean implements FactoryBean, InitializingBean{

	private Cipher cipher;
	private String algorithm;
	private String initializationVector;
	private Provider provider;
	private Key key;
	private int operationMode;
	
	public void afterPropertiesSet() throws Exception {
		if (!StringUtils.hasLength(algorithm)){
			algorithm = "AES";
			//System.out.println("Using AES as algorithm");
		}
		if (provider!=null){
			Security.addProvider(provider);
		} else {
			//System.out.println("Using default security provider");
		}
		if (provider!=null){
			cipher = Cipher.getInstance(algorithm, provider);
		} else {
			cipher = Cipher.getInstance(algorithm);
		}
		//System.out.println("operationMode=" + operationMode);
		//System.out.println("key=" + key);
		if (initializationVector!=null) {
			cipher.init(operationMode, key, new IvParameterSpec(initializationVector.getBytes()));
		} else {
			cipher.init(operationMode, key);
		}
	}
	
	public String getAlgorithm() {
		return algorithm;
	}

	public void setAlgorithm(String algorithm) {
		this.algorithm = algorithm;
	}

	public Provider getProvider() {
		return provider;
	}

	public void setProvider(Provider provider) {
		this.provider = provider;
	}

	public Key getKey() {
		return key;
	}

	public void setKey(Key key) {
		this.key = key;
	}

	public int getOperationMode() {
		return operationMode;
	}

	public void setOperationMode(int operationMode) {
		this.operationMode = operationMode;
	}

	public Object getObject() throws Exception {
		return cipher;
	}

	public Class getObjectType() {
		return Cipher.class;
	}

	public boolean isSingleton() {
		return false;
	}

	public String getInitializationVector() {
		return initializationVector;
	}

	public void setInitializationVector(String initializationVector) {
		this.initializationVector = initializationVector;
	}
}
