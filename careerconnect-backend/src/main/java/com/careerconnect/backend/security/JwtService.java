package com.careerconnect.backend.security;

import java.time.Instant;
import java.util.Date;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

	private final SecretKey signingKey;
	private final long expirationMillis;

	public JwtService(
			@Value("${app.jwt.secret}") String base64Secret,
			@Value("${app.jwt.expiration}") long expirationMillis
	) {
		if (expirationMillis <= 0) {
			throw new IllegalArgumentException("JWT expiration must be positive");
		}

		byte[] keyBytes;
		try {
			keyBytes = Decoders.BASE64.decode(base64Secret);
		} catch (IllegalArgumentException exception) {
			throw new IllegalArgumentException("JWT secret must be Base64 encoded", exception);
		}

		if (keyBytes.length < 32) {
			throw new IllegalArgumentException("JWT secret must contain at least 32 bytes");
		}

		this.signingKey = Keys.hmacShaKeyFor(keyBytes);
		this.expirationMillis = expirationMillis;
	}

	public String generateToken(UserDetails userDetails) {
		Instant issuedAt = Instant.now();
		return Jwts.builder()
				.subject(userDetails.getUsername())
				.claim("role", extractRole(userDetails))
				.issuedAt(Date.from(issuedAt))
				.expiration(Date.from(issuedAt.plusMillis(expirationMillis)))
				.signWith(signingKey)
				.compact();
	}

	public String extractUsername(String token) {
		return extractClaims(token).getSubject();
	}

	public boolean isTokenValid(String token, UserDetails userDetails) {
		try {
			Claims claims = extractClaims(token);
			return userDetails.getUsername().equals(claims.getSubject())
					&& claims.getExpiration().after(new Date());
		} catch (JwtException | IllegalArgumentException exception) {
			return false;
		}
	}

	private Claims extractClaims(String token) {
		return Jwts.parser()
				.verifyWith(signingKey)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	private String extractRole(UserDetails userDetails) {
		return userDetails.getAuthorities().stream()
				.map(GrantedAuthority::getAuthority)
				.filter(authority -> authority.startsWith("ROLE_"))
				.map(authority -> authority.substring("ROLE_".length()))
				.findFirst()
				.orElseThrow(() -> new IllegalArgumentException("User has no role authority"));
	}
}
