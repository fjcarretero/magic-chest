/*
 * Copyright 2006 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package com.fcs.chest.magic.cipher;

import java.io.IOException;
import java.io.InputStream;
import java.security.GeneralSecurityException;
import java.security.KeyStore;

import org.springframework.beans.factory.FactoryBean;
import org.springframework.beans.factory.InitializingBean;
import org.springframework.core.io.Resource;
import org.springframework.util.StringUtils;

/**
 * Spring factory bean for a <code>java.security.KeyStore</code>.
 * <p/>
 * To load an existing key store, you must set the <code>location</code> property. If this property is not set, a new,
 * empty key store is created, which is most likely not what you want.
 *
 * @author Arjen Poutsma
 * @see #setLocation(org.springframework.core.io.Resource)
 */
public class KeyStoreFactoryBean implements  FactoryBean,
        InitializingBean {

    private KeyStore keyStore;

    private String type;

    private String provider;

    private Resource location;

    private char[] password;

    /**
     * Sets the location of the key store to use. If this is not set, a new, empty key store will be used.
     *
     * @see KeyStore#load(java.io.InputStream, char[])
     */
    public void setLocation(Resource location) {
        this .location = location;
    }

    /**
     * Sets the password to use for integrity checking. If this property is not set, then integrity checking is not
     * performed.
     */
    public void setPassword(String password) {
        if (password != null) {
            this .password = password.toCharArray();
        }
    }

    /**
     * Sets the provider of the key store to use. If this is not set, the default is used.
     */
    public void setProvider(String provider) {
        this .provider = provider;
    }

    /**
     * Sets the type of the <code>KeyStore</code> to use. If this is not set, the default is used.
     *
     * @see KeyStore#getDefaultType()
     */
    public void setType(String type) {
        this .type = type;
    }

    public Object getObject() throws Exception {
        return keyStore;
    }

    public Class getObjectType() {
        return KeyStore.class;
    }

    public boolean isSingleton() {
        return true;
    }

    public final void afterPropertiesSet()
            throws GeneralSecurityException, IOException {
        if (StringUtils.hasLength(provider)
                && StringUtils.hasLength(type)) {
            keyStore = KeyStore.getInstance(type, provider);
        } else if (StringUtils.hasLength(type)) {
            keyStore = KeyStore.getInstance(type);
        } else {
            keyStore = KeyStore.getInstance(KeyStore.getDefaultType());
        }
        InputStream is = null;
        try {
            if (location != null && location.exists()) {
                is = location.getInputStream();
               	//System.out.println("Loading key store from " + location);
            } else {
            	//System.out.println("location=" + location);
            	//System.out.println("location.exists=" + location.exists());
            	//System.out.println("Creating empty key store");
            }
            keyStore.load(is, password);
        } finally {
            if (is != null) {
                is.close();
            }
        }
    }
}
