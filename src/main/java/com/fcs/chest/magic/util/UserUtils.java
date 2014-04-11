package com.fcs.chest.magic.util;

import java.io.IOException;

import org.codehaus.jackson.JsonParseException;
import org.codehaus.jackson.map.JsonMappingException;
import org.codehaus.jackson.map.ObjectMapper;

import com.fcs.chest.magic.domain.User;

public class UserUtils {
	public static User parseUser(String jsonUser) throws JsonParseException, JsonMappingException, IOException {
		ObjectMapper mapper = new ObjectMapper();
		User uh = mapper.readValue(jsonUser, User.class); 
		return uh;
	}
}
