package com.fcs.chest.magic.controller;

import java.io.IOException;
import java.io.UnsupportedEncodingException;
import java.util.ArrayList;
import java.util.Iterator;
import java.util.List;

import javax.crypto.BadPaddingException;
import javax.crypto.IllegalBlockSizeException;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import org.apache.commons.codec.DecoderException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.multipart.MultipartFile;

import com.dropbox.core.DbxClient;
import com.dropbox.core.DbxEntry;
import com.dropbox.core.DbxException;
import com.dropbox.core.DbxRequestConfig;
import com.dropbox.core.DbxWriteMode;
import com.fcs.chest.magic.cipher.DecryptorHelper;
import com.fcs.chest.magic.cipher.EncryptorHelper;
import com.fcs.chest.magic.domain.File;

@Controller
@RequestMapping("files/dropbox")
public class DbxFilesController {
	 
	 @Autowired
	 private HttpSession session;
	 
	 @Autowired
	 private EncryptorHelper encryptorHelper;
	 
	 @Autowired
	 private DecryptorHelper decryptorHelper;

	@RequestMapping("list")
	@ResponseBody
	public File[] listFiles() throws DbxException, IllegalBlockSizeException, BadPaddingException {
        DbxRequestConfig config = (DbxRequestConfig)session.getAttribute("config");
        String accessToken = (String)session.getAttribute("accessToken");
		DbxClient client = new DbxClient(config, accessToken);
		
		DbxEntry.WithChildren listing = client.getMetadataWithChildren("/");

		List<File> files = new ArrayList<File>(listing.children.size());
		File file = null;
		String name = null;
		for (Iterator<DbxEntry> iterator = listing.children.iterator(); iterator.hasNext();) {
			file = new File();
			name = iterator.next().name;
			String[] kk;
			try {
				kk = decryptorHelper.decrypt(name).split("\\|");
				file.setName(kk[0]);
				file.setCipheredName(name);
				file.setDocumentType(kk[1]);
				file.setType("file");
				files.add(file);
			} catch (UnsupportedEncodingException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			} catch (DecoderException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
		return (File[])files.toArray(new File[files.size()]);
	}
	
	@RequestMapping(value="upload", method=RequestMethod.POST)
	@ResponseBody
	public void uploadFile(@RequestParam MultipartFile file){
        DbxRequestConfig config = (DbxRequestConfig)session.getAttribute("config");
        String accessToken = (String)session.getAttribute("accessToken");
		DbxClient client = new DbxClient(config, accessToken);
		
		try {
			System.out.println("Name=" + file.getOriginalFilename());
			System.out.println("ContentType=" + file.getContentType());
			String kk = file.getOriginalFilename() + "|" + file.getContentType();
			String newName = encryptorHelper.encrypt(kk);
			System.out.println("Name=" + newName);
			DbxEntry.File uploadfile = client.uploadFile("/" + newName , DbxWriteMode.add(), -1, encryptorHelper.getCipherInputStream(file.getInputStream()));
			System.out.println("Uploaded: " + uploadfile.toString());
		} catch (Exception e) {
			e.printStackTrace();
		} finally {
			try {
				encryptorHelper.close(); 
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
	}
	
	@RequestMapping(value="download")
	@ResponseBody
	public void downloadFile(String fileName, HttpServletResponse response) {
        DbxRequestConfig config = (DbxRequestConfig)session.getAttribute("config");
        String accessToken = (String)session.getAttribute("accessToken");
		DbxClient client = new DbxClient(config, accessToken);
		try {
			System.out.println(fileName);	
			String newName = decryptorHelper.decrypt(fileName);
			System.out.println(newName);
			String[] kk = newName.split("\\|");
			
			String nam = kk[0];
			System.out.println(nam);
			String mimetype = kk[1];
			System.out.println(mimetype);
			if (mimetype == null) {
				mimetype = "application/octet-stream";
			}
			response.setContentType(mimetype);
			response.setHeader("Content-Disposition", "attachment; filename=\"" + nam + "\"");
			DbxEntry.File file = client.getFile("/" + fileName, null, decryptorHelper.getCipherOutputStream(response.getOutputStream()));
			response.setContentLength((int)file.numBytes);

		} catch(Exception e) {
			e.printStackTrace();
		} finally {
			try {
				decryptorHelper.close();
			} catch (IOException e) {
				// TODO Auto-generated catch block
				e.printStackTrace();
			}
		}
		
	}
}