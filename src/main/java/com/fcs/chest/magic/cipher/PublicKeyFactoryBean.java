package com.fcs.chest.magic.cipher;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.security.KeyStore;
import java.security.PublicKey;
import java.security.cert.Certificate;
import java.security.cert.CertificateFactory;
import java.security.cert.X509Certificate;
import java.security.interfaces.RSAPublicKey;

import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.util.StringUtils;

public class PublicKeyFactoryBean implements FactoryBean, InitializingBean{

	private PublicKey publicKey;
	private KeyStore keyStore;
	private String certificateAlias;
	private String certificateType;
	
	public void afterPropertiesSet() throws Exception {
		if (keyStore == null)
			throw new RuntimeException("KeyStore can not be null");
		if (!StringUtils.hasLength(certificateAlias))
			throw new RuntimeException("Certificate alias can not be empty");
		if (!StringUtils.hasLength(certificateType)){
			certificateType = "X.509";
			System.out.println("Using X.509 as certificate type");
		}		Certificate cert = keyStore.getCertificate(certificateAlias);
		InputStream inputStream = new ByteArrayInputStream(cert.getEncoded());
		CertificateFactory fact=CertificateFactory.getInstance(certificateType);
		X509Certificate x509Certificate = (X509Certificate) fact.generateCertificate(inputStream);
		publicKey = (RSAPublicKey)x509Certificate.getPublicKey();
	}
	
    public Object getObject() throws Exception {
        return publicKey;
    }

    public Class getObjectType() {
        return PublicKey.class;
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

	public String getCertificateAlias() {
		return certificateAlias;
	}

	public void setCertificateAlias(String certificateAlias) {
		this.certificateAlias = certificateAlias;
	}

	public String getCertificateType() {
		return certificateType;
	}

	public void setCertificateType(String certificateType) {
		this.certificateType = certificateType;
	}

}
