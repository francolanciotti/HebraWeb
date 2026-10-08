/**
 * Three.js r128 RGBELoader (Radiance HDR Loader)
 * Self-hosted ES Module for WebHebra / Three.js r128
 */

import {
	DataTextureLoader,
	DataUtils,
	FloatType,
	HalfFloatType,
	LinearEncoding,
	LinearFilter,
	NearestFilter,
	RGBEEncoding,
	RGBEFormat,
	RGBAFormat,
	UnsignedByteType
} from 'three';

class RGBELoader extends DataTextureLoader {

	constructor( manager ) {

		super( manager );

		this.type = HalfFloatType;

	}

	parse( buffer ) {

		const
			/* Return values for RGBE_ReadHeader() and RGBE_ReadPixels() */
			RGBE_READ_SUCCESS = 0,
			RGBE_READ_ERROR = - 1,

			/* Header flags */
			RGBE_VALID_PROGRAMTYPE = 0x01,
			RGBE_VALID_FORMAT = 0x02,
			RGBE_VALID_DIMENSIONS = 0x04,

			NEWLINE = '\n',

			fgets = function ( buffer, lineLimit, consume ) {

				lineLimit = ! lineLimit ? 1024 : lineLimit;
				let p = +( consume || 0 );
				let line = '';

				while ( p < buffer.byteLength ) {

					const c = buffer[ p ++ ];
					if ( c === 0x0a ) { // \n

						break;

					}

					if ( c === 0x0d ) { // \r

						continue;

					}

					line += String.fromCharCode( c );
					if ( line.length >= lineLimit ) break;

				}

				return { line: line, p: p };

			},

			/* Parse an RGBE header */
			RGBE_ReadHeader = function ( buffer ) {

				let line, match,
					flags = 0, format = '',
					lineLimit = 100,
					pos = 0;

				const res = fgets( buffer, lineLimit, pos );
				line = res.line;
				pos = res.p;

				if ( pos >= buffer.byteLength || line.charAt( 0 ) !== '#' || line.charAt( 1 ) !== '?' ) {

					return RGBE_READ_ERROR;

				}

				flags |= RGBE_VALID_PROGRAMTYPE;

				while ( true ) {

					const res = fgets( buffer, lineLimit, pos );
					line = res.line;
					pos = res.p;

					if ( line.length === 0 ) break;

					if ( line.charAt( 0 ) === '#' ) continue;

					if ( ( match = line.match( /^FORMAT=(.*)$/ ) ) ) {

						format = match[ 1 ];
						flags |= RGBE_VALID_FORMAT;

					}

				}

				if ( ! ( flags & RGBE_VALID_FORMAT ) ) {

					return RGBE_READ_ERROR;

				}

				if ( format !== '32-bit_rle_rgbe' && format !== '32-bit_rle_xyze' ) {

					return RGBE_READ_ERROR;

				}

				const res2 = fgets( buffer, lineLimit, pos );
				line = res2.line;
				pos = res2.p;

				if ( ( match = line.match( /^[-+]Y\s+(\d+)\s+[-+]X\s+(\d+)/ ) ) ) {

					flags |= RGBE_VALID_DIMENSIONS;

				} else {

					return RGBE_READ_ERROR;

				}

				return {
					width: parseInt( match[ 2 ], 10 ),
					height: parseInt( match[ 1 ], 10 ),
					data: pos
				};

			},

			RGBE_ReadPixels_RLE = function ( buffer, w, h ) {

				const data_rgba = new Uint8Array( 4 * w * h );
				let offset = 0, pos = 0;
				const scanline_buffer = new Uint8Array( 4 * w );
				let ptr, ptr_end;
				let count;
				const buf = new Uint8Array( 2 );

				if ( ( w < 8 ) || ( w > 0x7fff ) ) {

					return RGBE_ReadPixels_Flat( buffer, w, h );

				}

				for ( let rgbeEnd = h; rgbeEnd > 0; rgbeEnd -- ) {

					if ( pos + 4 > buffer.byteLength ) {

						return RGBE_READ_ERROR;

					}

					buf[ 0 ] = buffer[ pos ++ ];
					buf[ 1 ] = buffer[ pos ++ ];
					const c2 = buffer[ pos ++ ];
					const c3 = buffer[ pos ++ ];

					if ( ( buf[ 0 ] !== 2 ) || ( buf[ 1 ] !== 2 ) || ( c2 & 0x80 ) ) {

						// This file is not run length encoded
						pos -= 4;
						return RGBE_ReadPixels_Flat( buffer, w, h );

					}

					if ( ( ( c2 << 8 ) | c3 ) !== w ) {

						return RGBE_READ_ERROR;

					}

					ptr = 0;
					// Read each of the four channels for the scanline
					for ( let i = 0; i < 4; i ++ ) {

						ptr_end = ( i + 1 ) * w;
						while ( ptr < ptr_end ) {

							count = buffer[ pos ++ ];
							const isRLE = ( count > 128 );
							if ( isRLE ) count -= 128;

							if ( ( count === 0 ) || ( ptr + count > ptr_end ) ) {

								return RGBE_READ_ERROR;

							}

							if ( isRLE ) {

								const val = buffer[ pos ++ ];
								while ( count > 0 ) {

									scanline_buffer[ ptr ++ ] = val;
									count --;

								}

							} else {

								while ( count > 0 ) {

									scanline_buffer[ ptr ++ ] = buffer[ pos ++ ];
									count --;

								}

							}

						}

					}

					// Now convert data from split channels to rgba
					for ( let i = 0; i < w; i ++ ) {

						data_rgba[ offset ] = scanline_buffer[ i ];
						data_rgba[ offset + 1 ] = scanline_buffer[ i + w ];
						data_rgba[ offset + 2 ] = scanline_buffer[ i + 2 * w ];
						data_rgba[ offset + 3 ] = scanline_buffer[ i + 3 * w ];
						offset += 4;

					}

				}

				return data_rgba;

			},

			RGBE_ReadPixels_Flat = function ( buffer, w, h ) {

				const data_rgba = new Uint8Array( 4 * w * h );
				let offset = 0;
				let pos = 0;

				for ( let i = 0; i < w * h; i ++ ) {

					data_rgba[ offset ++ ] = buffer[ pos ++ ];
					data_rgba[ offset ++ ] = buffer[ pos ++ ];
					data_rgba[ offset ++ ] = buffer[ pos ++ ];
					data_rgba[ offset ++ ] = buffer[ pos ++ ];

				}

				return data_rgba;

			};

		const byteArray = new Uint8Array( buffer );
		const header = RGBE_ReadHeader( byteArray );

		if ( header === RGBE_READ_ERROR ) {

			throw new Error( 'THREE.RGBELoader: Failed to parse RGBE header.' );

		}

		const w = header.width,
			h = header.height,
			image_rgba = RGBE_ReadPixels_RLE( byteArray.subarray( header.data ), w, h );

		if ( image_rgba === RGBE_READ_ERROR ) {

			throw new Error( 'THREE.RGBELoader: Failed to read pixels from RGBE file.' );

		}

		let data, type, format;

		switch ( this.type ) {

			case UnsignedByteType:

				data = image_rgba;
				format = RGBEFormat;
				type = UnsignedByteType;
				break;

			case FloatType:

				// Convert RGBE to Float32
				const numElements = image_rgba.length / 4;
				const floatData = new Float32Array( numElements * 4 );

				for ( let i = 0; i < numElements; i ++ ) {

					const r = image_rgba[ i * 4 ];
					const g = image_rgba[ i * 4 + 1 ];
					const b = image_rgba[ i * 4 + 2 ];
					const e = image_rgba[ i * 4 + 3 ];

					if ( e > 0 ) {

						const f = Math.pow( 2.0, e - 128.0 - 8.0 );
						floatData[ i * 4 ] = r * f;
						floatData[ i * 4 + 1 ] = g * f;
						floatData[ i * 4 + 2 ] = b * f;
						floatData[ i * 4 + 3 ] = 1.0;

					} else {

						floatData[ i * 4 ] = 0;
						floatData[ i * 4 + 1 ] = 0;
						floatData[ i * 4 + 2 ] = 0;
						floatData[ i * 4 + 3 ] = 1.0;

					}

				}

				data = floatData;
				format = RGBAFormat;
				type = FloatType;
				break;

			case HalfFloatType:

				// Convert RGBE to HalfFloat (Uint16Array)
				const numElementsHalf = image_rgba.length / 4;
				const halfData = new Uint16Array( numElementsHalf * 4 );

				for ( let i = 0; i < numElementsHalf; i ++ ) {

					const r = image_rgba[ i * 4 ];
					const g = image_rgba[ i * 4 + 1 ];
					const b = image_rgba[ i * 4 + 2 ];
					const e = image_rgba[ i * 4 + 3 ];

					if ( e > 0 ) {

						const f = Math.pow( 2.0, e - 128.0 - 8.0 );
						halfData[ i * 4 ] = DataUtils.toHalfFloat( r * f );
						halfData[ i * 4 + 1 ] = DataUtils.toHalfFloat( g * f );
						halfData[ i * 4 + 2 ] = DataUtils.toHalfFloat( b * f );
						halfData[ i * 4 + 3 ] = DataUtils.toHalfFloat( 1.0 );

					} else {

						halfData[ i * 4 ] = 0;
						halfData[ i * 4 + 1 ] = 0;
						halfData[ i * 4 + 2 ] = 0;
						halfData[ i * 4 + 3 ] = DataUtils.toHalfFloat( 1.0 );

					}

				}

				data = halfData;
				format = RGBAFormat;
				type = HalfFloatType;
				break;

			default:

				throw new Error( 'THREE.RGBELoader: Unsupported type: ' + this.type );

		}

		return {
			width: w,
			height: h,
			data: data,
			header: header,
			format: format,
			type: type
		};

	}

	setDataType( value ) {

		this.type = value;
		return this;

	}

	load( url, onLoad, onProgress, onError ) {

		function addExtension( texture ) {

			texture.encoding = ( this.type === UnsignedByteType ) ? RGBEEncoding : LinearEncoding;
			texture.minFilter = ( this.type === UnsignedByteType ) ? NearestFilter : LinearFilter;
			texture.magFilter = ( this.type === UnsignedByteType ) ? NearestFilter : LinearFilter;
			texture.generateMipmaps = false;
			texture.flipY = true;

		}

		const texture = super.load( url, ( tex ) => {

			addExtension.call( this, tex );
			if ( onLoad ) onLoad( tex );

		}, onProgress, onError );

		return texture;

	}

}

export { RGBELoader };
