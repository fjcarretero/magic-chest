package com.fcs.chest.magic.controller;

import java.io.IOException;
import java.net.URLDecoder;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.crypto.BadPaddingException;
import javax.crypto.CipherInputStream;
import javax.crypto.CipherOutputStream;
import javax.crypto.IllegalBlockSizeException;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.DecoderException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;
import com.fcs.chest.magic.domain.DataHolder;
import com.fcs.chest.magic.domain.File;
import com.fcs.chest.magic.domain.ShareFilesRequest;
import com.fcs.chest.magic.domain.State;
import com.fcs.chest.magic.domain.StateHolder;
import com.fcs.chest.magic.util.FileUploadProgressListener;
import com.fcs.chest.magic.util.WorkingTask;
import com.google.api.client.googleapis.media.MediaHttpUploader;
import com.google.api.client.googleapis.media.MediaHttpUploader.UploadState;
import com.google.api.client.http.GenericUrl;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.HttpResponse;
import com.google.api.client.http.HttpTransport;
import com.google.api.client.http.InputStreamContent;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.JsonFactory;
import com.google.api.client.json.jackson.JacksonFactory;
import com.google.api.services.drive.Drive;
import com.google.api.services.drive.Drive.Files.Insert;
import com.google.api.services.drive.model.FileList;
import com.google.api.services.drive.model.Permission;
import com.google.api.services.drive.model.PermissionList;

@Controller
@RequestMapping("api/files/google")
public class GoogleFilesController {
	 
	@Autowired
	private DataHolder dataHolder;
	
	@RequestMapping(value="download")
	@ResponseBody
	public void downloadFile(String url, String fileName, String permissionId, HttpServletResponse response) {
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		
		Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();
		//System.out.println(fileName);
		
		CipherOutputStream cos = null;
		try {
			DecryptorHelper decryptorHelper = dataHolder.getCipherHelpers().get(permissionId).getDecryptorHelper();
			HttpResponse res = service.getRequestFactory().buildGetRequest(new GenericUrl(URLDecoder.decode(url, "UTF-8"))).execute();
			String newName = decryptorHelper.decrypt(fileName);
			//System.out.println(newName);
			String[] kk = newName.split("\\|");
			String nam = kk[0];
			//System.out.println(nam);
			String mimetype = kk[1];
			//System.out.println(mimetype);
			if (mimetype == null) {
				mimetype = "application/octet-stream";
			}
			response.setContentType(mimetype);
			response.setHeader("Content-Disposition", "attachment; filename=\""
					+ nam + "\"");
			//response.setContentLength((int)res.numBytes);
			cos = decryptorHelper.getCipherOutputStream(response.getOutputStream());
			res.download(cos);
		} catch (Exception e) {
			// TODO: handle exception
			e.printStackTrace();
		} finally {
			if (cos != null) {
				try {
					cos.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
			}
		}

		
	}
	
	@RequestMapping(value="upload2", method=RequestMethod.POST)
	@ResponseBody
	public File uploadFile2(@RequestParam MultipartFile file){
		String ret = "Success";
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		
		Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();

		com.google.api.services.drive.model.File f = new com.google.api.services.drive.model.File();
		CipherInputStream cis = null;
		File uf = null;
		try {
			EncryptorHelper encryptorHelper = dataHolder.getUserCipherHelper().getEncryptorHelper();
			String kk = file.getOriginalFilename() + "|" + file.getContentType();
			String newName = encryptorHelper.encrypt(kk);
		
			f.setTitle(newName);
			f.setMimeType("application/vnd.rig.cryptonote");
			//f.setParents(Arrays.asList(new ParentReference().setId(dataHolder.getFolderId())));
			InputStreamContent content;
		
			cis = encryptorHelper.getCipherInputStream(file.getInputStream());
			content = new InputStreamContent("application/octet-stream", cis);
		
			com.google.api.services.drive.model.File guf = service.files().insert(f, content).execute();
			uf = new File();
			uf.setName(file.getOriginalFilename());
			uf.setCipheredName(newName);
			uf.setDocumentType(file.getContentType());
			uf.setDownloadUrl(URLEncoder.encode(guf.getDownloadUrl(), "UTF-8"));
			uf.setId(guf.getId());
			uf.setType("file");
			uf.setOwner(guf.getOwners());
			uf.setPermissionId(guf.getOwners().get(0).getPermissionId());
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IllegalBlockSizeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (BadPaddingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			if (cis != null) {
				try {
					cis.close();
				} catch (IOException e) {
					// TODO Auto-generated catch block
					e.printStackTrace();
				}
				
			}
			return uf;
			//System.out.println("File successfully uploaded!");
		}
	}
	
	@RequestMapping(value="delete", method=RequestMethod.POST)
	@ResponseBody
	public String[] deleteFile(@RequestBody String[] id) {
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		
	    //System.out.println(id);
	    
		Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();
		try {
			for (int i=0; i<id.length; i++){
				service.files().delete(id[i]).execute();
			}
		} catch (IOException e) {
			// TODO: handle exception
			e.printStackTrace();
		} finally {
			return id;
		}
	}

	@RequestMapping("list")
	@ResponseBody
	public File[] listFiles(HttpServletResponse response) {	
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		
	    List<File> files = null;
	    File[] fileArray = null;
	    try {
			Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();
			
			FileList cl = service.files().list()
					//.setQ("'" + dataHolder.getFolderId() + "' in parents and title!='magic-chest' and mimeType='application/vnd.rig.cryptonote'")
					.setQ("title != 'magic-chest' and mimeType='application/vnd.rig.cryptonote'")
					.execute();
			files = new ArrayList<File>(cl.size());
			File file = null;
			com.google.api.services.drive.model.File gFile;
			String name = null;
			DecryptorHelper decryptorHelper;
			for (Iterator<com.google.api.services.drive.model.File> iterator = cl
					.getItems().iterator(); iterator.hasNext();) {
				file = new File();
				gFile = iterator.next();
				String permissionId = gFile.getOwners().get(0).getPermissionId();
				decryptorHelper = dataHolder.getCipherHelpers().get(permissionId).getDecryptorHelper();
				name = gFile.getTitle();
				String[] kk;
				kk = decryptorHelper.decrypt(name).split("\\|");
				//System.out.println(gFile.getDownloadUrl());
				file.setDownloadUrl(URLEncoder.encode(gFile.getDownloadUrl(),
						"UTF-8"));
				file.setName(kk[0]);
				file.setId(gFile.getId());
				//System.out.println(kk[0] + "=" + gFile.getId());
				file.setCipheredName(gFile.getOriginalFilename());
				file.setDocumentType(kk[1]);
				file.setType("file");
				file.setOwner(gFile.getOwners());
				file.setPermissionId(permissionId);
				files.add(file);
				/*
				PermissionList pl = service.permissions().list(gFile.getId()).execute();
				for (Iterator<Permission> it = pl
						.getItems().iterator(); it.hasNext();) {
					Permission per = it.next();
					System.out.println(per.getRole());
					System.out.println(per.getType());
					System.out.println(per.getValue());
				}
				*/
			}
			fileArray = files.toArray(new File[files.size()]);
		} catch (IOException e) {
			// TODO: handle exception
			e.printStackTrace();
		} catch (IllegalBlockSizeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (BadPaddingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (DecoderException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} finally {
			return fileArray;
		}
	}
	
	@RequestMapping(value="share", method=RequestMethod.POST)
	@ResponseBody
	public String shareFile(@RequestBody ShareFilesRequest shareFileRequest) {
		String ret = "Success";
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();
		Permission permission = new Permission();
		permission.setValue(shareFileRequest.getEmail());
		permission.setRole("reader");
		permission.setType("user");
		String[] fileId = shareFileRequest.getFileId();
		try {
			if(!dataHolder.getSharedWith().contains(shareFileRequest.getEmail())){
				System.out.println("no paso por aqui");
				service.permissions().insert(dataHolder.getKeyFileId(), permission).setSendNotificationEmails(false).execute();
			}
			for (int i=0; i<fileId.length; i++){
				service.permissions().insert(fileId[i], permission).setSendNotificationEmails(false).execute();
			}
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
			ret = "Failure";
		} finally {
			return ret;
		}
	}

	@RequestMapping(value="upload", method=RequestMethod.POST)
	@ResponseBody
	public File uploadFile(@RequestParam MultipartFile file, HttpSession session){
		String ret = "Success";
		HttpTransport httpTransport = new NetHttpTransport();
	    JsonFactory jsonFactory = new JacksonFactory();
		
		Drive service = new Drive.Builder(httpTransport, jsonFactory, dataHolder.getCredential()).build();
	
		com.google.api.services.drive.model.File f = new com.google.api.services.drive.model.File();
		CipherInputStream cis = null;
		File uf = null;
		try {
			EncryptorHelper encryptorHelper = dataHolder.getUserCipherHelper().getEncryptorHelper();
			String kk = file.getOriginalFilename() + "|" + file.getContentType();
			String newName = encryptorHelper.encrypt(kk);
		
			f.setTitle(newName);
			f.setMimeType("application/vnd.rig.cryptonote");
			//f.setParents(Arrays.asList(new ParentReference().setId(dataHolder.getFolderId())));
			InputStreamContent content;
		
			cis = encryptorHelper.getCipherInputStream(file.getInputStream());
			content = new InputStreamContent("application/octet-stream", cis);
			content.setLength(file.getSize());
			
			Insert insert = service.files().insert(f, content);
			
			uf = new File();
			uf.setName(file.getOriginalFilename());
			uf.setCipheredName(newName);
			uf.setDocumentType(file.getContentType());
			uf.setType("file");
			WorkingTask wt = new WorkingTask();
			wt.setInsert(insert);
			wt.setSession(session);
			wt.setCis(cis);
			Thread t = new Thread(wt);
			t.start();
		} catch (IOException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (IllegalBlockSizeException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		} catch (BadPaddingException e) {
			// TODO Auto-generated catch block
			e.printStackTrace();
		}catch (Throwable e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
		} finally {
			
			return uf;
			//System.out.println("File successfully uploaded!");
		}
	}
	
	@RequestMapping(value="status", headers="Accept=*/*")
	@ResponseBody
	public State status(HttpSession session){
		State m = (State)session.getAttribute("uploadState");
		//System.out.println(m);
		return m;
	}

}