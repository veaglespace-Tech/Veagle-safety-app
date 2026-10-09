const { Jimp } = require('jimp');

async function main() {
    try {
        console.log("Loading logo.png...");
        // In jimp v1, the import might be different depending on the version. Let's assume standard usage.
        const original = await Jimp.read('../mobile/assets/logo.png');
        
        // Resize original slightly smaller so we have room for padding and shadow
        const size = 1024;
        const padding = 150;
        const logoSize = size - padding * 2;
        
        original.resize({ w: logoSize });
        
        // Create shadow image
        console.log("Creating shadow...");
        const shadow = original.clone();
        
        // Make shadow dark
        shadow.scan((x, y, idx) => {
            // Keep alpha, change color to a dark shadow color (e.g., dark pink #8a1c3c or black)
            shadow.bitmap.data[idx + 0] = 50; // R
            shadow.bitmap.data[idx + 1] = 0;  // G
            shadow.bitmap.data[idx + 2] = 20; // B
            // Reduce alpha for shadow
            const a = shadow.bitmap.data[idx + 3];
            shadow.bitmap.data[idx + 3] = Math.min(a, 100); 
        });
        
        // Blur shadow
        shadow.blur(15);
        
        // Create new background
        console.log("Compositing...");
        const background = new Jimp({ width: size, height: size, color: '#FFF0F3' });
        
        // Offset for shadow
        const shadowOffsetX = padding + 15;
        const shadowOffsetY = padding + 25;
        
        // Composite shadow
        background.composite(shadow, shadowOffsetX, shadowOffsetY);
        
        // Composite original
        background.composite(original, padding, padding);
        
        // Save
        const outputPath = '../mobile/assets/logo_attractive.png';
        await background.write(outputPath);
        console.log("Saved attractive logo to", outputPath);
    } catch (e) {
        console.error("Error generating image:", e);
    }
}

main();
