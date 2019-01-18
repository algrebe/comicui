var _ComicUIWebP = function () {
    function ConvertToPNG(_data) {
        console.log("converting...");
        var WebPImage = { width:{value:0},height:{value:0} }
        var decoder = new WebPDecoder();
        
        data=convertBinaryToArray(_data);

        var config = decoder.WebPDecoderConfig;
        var output_buffer = config.output;
        var bitstream = config.input;

        if (!decoder.WebPInitDecoderConfig(config)) {
            console.error("webp: library version mismatch");
            return _data;
        }

        var StatusCode = decoder.VP8StatusCode;
        var status = decoder.WebPGetFeatures(data, data.length, bitstream);
        if (status != StatusCode.VP8_STATUS_OK) {
            console.error("webp: failed to get features");
            return _data;
        }

        var mode = decoder.WEBP_CSP_MODE;
        output_buffer.colorspace = mode.MODE_RGBA;

        status = decoder.WebPDecode(data, data.length, config);

        if (status != StatusCode.VP8_STATUS_OK) {
            console.error("webp: failed to decode data");
            return _data;
        }

        var bitmap = output_buffer.u.RGBA.rgba;
        if (!bitmap) {
            console.error("no bitmap found");
            return _data;
        }

        var biHeight = output_buffer.height;
        var biWidth = output_buffer.width;

        var canvas = document.createElement("canvas");
        canvas.height = biHeight;
        canvas.width = biWidth;

        var context = canvas.getContext('2d');
        var output = context.createImageData(canvas.width, canvas.height);
        var outputData = output.data;
        for (var h=0;h<biHeight;h++) {			
            for (var w=0;w<biWidth;w++) {
                outputData[2+w*4+(biWidth*4)*h] = bitmap[2+w*4+(biWidth*4)*h];
                outputData[1+w*4+(biWidth*4)*h] = bitmap[1+w*4+(biWidth*4)*h];
                outputData[0+w*4+(biWidth*4)*h] = bitmap[0+w*4+(biWidth*4)*h];
                outputData[3+w*4+(biWidth*4)*h] = bitmap[3+w*4+(biWidth*4)*h];
            };			
        }
        context.putImageData(output, 0, 0);
        var du = canvas.toDataURL();
        return du;
    }

    return {
        ConvertToPNG: ConvertToPNG,
    }
}();
