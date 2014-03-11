package com.fcs.chest.magic.controller;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URLDecoder;
import java.security.Key;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;

import org.apache.commons.codec.DecoderException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;

import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;
import com.fcs.chest.magic.domain.CipherHelper;
import com.fcs.chest.magic.domain.DataHolder;
import com.fcs.chest.magic.domain.UserHolder;
import com.fcs.chest.magic.util.KeyUtils;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.model.File;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import com.google.api.services.drive.model.PermissionList;

@Controller
@RequestMapping("api/key/google")
public class GoogleKeyController {

	@Autowired
	private DataHolder dataHolder;
	
	@Autowired
	private UserHolder userHolder;
	
	@Autowired
	private EncryptorHelper encryptorHelper;

	@Autowired
	private DecryptorHelper decryptorHelper;

	@RequestMapping("generate")
	public String generateKey() {
		HttpTransport httpTransport = new NetHttpTransport();
		JsonFactory jsonFactory = new JacksonFactory();

		Drive service = new Drive.Builder(httpTransport, jsonFactory,
				dataHolder.getCredential()).build();
		
		Key key;
		CipherInputStream cis = null;
		try {
			/*
			FileList keys = service.files().list().setQ("title= 'magic-chest' and mimeType = 'application/vnd.rig.cryptonote' and '" + userHolder.getEmail() + "' in owners")
					.execute();
			
			if (keys.getItems().size() == 0) { */
			if (dataHolder.getPermissionId() == null){ 
				key = KeyUtils.generateKey();
				com.google.api.services.drive.model.File f = new com.google.api.services.drive.model.File();
					
				f.setTitle("magic-chest");
				f.setMimeType("application/vnd.rig.cryptonote");
				//f.setParents(Arrays.asList(new ParentReference().setId(dataHolder
				//		.getFolderId())));
				InputStreamContent content;
	
				cis = encryptorHelper
						.getCipherInputStream(new ByteArrayInputStream(key
								.getEncoded()));
				//System.out.println(Hex.encodeHex(key.getEncoded()));
				content = new InputStreamContent("application/vnd.rig.cryptonote", cis);
	
				File response = service.files().insert(f, content).execute();
				
				Map<String, CipherHelper> map = dataHolder.getCipherHelpers();
				if (map == null) {
					map = new HashMap<String, CipherHelper>();
					dataHolder.setCipherHelpers(map);
				}
				CipherHelper cipherHelper = new CipherHelper();
				cipherHelper.setKey(key);
				cipherHelper.initialize();
				String permissionId = response.getOwners().get(0).getPermissionId(); 
				map.put(permissionId, cipherHelper);
				dataHolder.setPermissionId(permissionId);
				dataHolder.setKeyFileId(response.getId());
			} else {
				System.out.println("A key already exists");
			}
		} catch (NoSuchAlgorithmException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			try {
				if (cis != null) {
					cis.close();
				}
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
			return "redirect:/main";
		}
	}
	
	@RequestMapping("retrieve")
	public String retrieveKey() {
		String url = "redirect:/main";
		try {
			Map<String, CipherHelper> rks = retrieveGoogleKey();
			if (rks != null) {
				dataHolder.setCipherHelpers(rks); 
				dataHolder.initialize();
			}
			
			if (dataHolder.getPermissionId() == null){
				url = "forward:/api/key/google/generate";
			}
			
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (Exception e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			return url;
		}
	}
	
	private Map<String, CipherHelper> retrieveGoogleKey() throws IOException {
		HttpTransport httpTransport = new NetHttpTransport();
		JsonFactory jsonFactory = new JacksonFactory();
		
		Drive service = new Drive.Builder(httpTransport, jsonFactory,
				dataHolder.getCredential()).build();

		FileList keys = service.files().list().setQ("title = 'magic-chest' and mimeType = 'application/vnd.rig.cryptonote'")
				.execute();
		
		if (keys.getItems().size() == 0) {
			System.out.println("NNNNNNNNNNNNNNOOOOOOOOOOOOOOOOOOOOOOOOOO");
			return null;
		} else {
			File keyFile;
			CipherHelper helper;
			Map<String, CipherHelper> map = new HashMap<String, CipherHelper>(keys.getItems().size());
			for (Iterator<com.google.api.services.drive.model.File> iterator = keys
					.getItems().iterator(); iterator.hasNext();) {
				keyFile = iterator.next();
				helper = new CipherHelper();
				String url = keyFile.getDownloadUrl();
				
				//System.out.println(userHolder.getUser().getName());
				if (keyFile.getOwnerNames().contains(userHolder.getUser().getName())) {
					//System.out.println(keyFile.getOwnerNames());
					dataHolder.setPermissionId(keyFile.getOwners().get(0).getPermissionId());
					dataHolder.setKeyFileId(keyFile.getId());
					List<String> shared = new ArrayList<String>();
					dataHolder.setSharedWith(shared);
					PermissionList pl = service.permissions().list(keyFile.getId()).execute();
					for (Iterator<Permission> it = pl.getItems().iterator(); it.hasNext();) {
						Permission per = it.next();
						if (!per.getRole().equals("owner")) {
							shared.add(per.getEmailAddress());
						}
					}
				}
				
				HttpResponse res = service.getRequestFactory().buildGetRequest(new GenericUrl(URLDecoder.decode(url, "UTF-8"))).execute();
				
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				//response.setContentLength((int)res.numBytes);
				CipherOutputStream cos = null;
				try {
					cos = decryptorHelper.getCipherOutputStream(baos);
					
					res.download(cos);
					byte[] enckey = baos.toByteArray();
					
					//System.out.println(Hex.encodeHex(enckey));
					
					helper.setKey(KeyUtils.generateKeyFromByteArray(enckey));
					
					map.put(keyFile.getOwners().get(0).getPermissionId(), helper);
				} catch (DecoderException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				} finally {
					if (cos != null) {
						cos.close();
					}
				}
			}
			return map;
		} 
	}
}