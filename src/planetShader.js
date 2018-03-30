window.onload = (function () {
    var SRC = {
        DAY: 'texture',
        NIGHT: 'night',
        NORMAL: 'normal',
        SPEC: 'specular'
    }

    var container;
    var camera, scene, renderer, controls;
    var uniforms;
    var mesh;
    var userImage;
    var fragSrc, vertSrc;

    var dayMap, nightMap, normalMap, specMap;
    var dayTex, nightTex, normalTex, specTex;

    var guiData = {
        antialias: 0.98,
        planetRotationSpeed: 0.02,
        planetSize: 10.0,
        auraSize: 0.3,
        lightPosX: 1,
        lightPosY: 0,
        lightPosZ: 0.3,
        lightColor: [255, 255, 255],
        auraColor: [255, 255, 255],
        ambientLightColor: [10, 10, 10],
        planetRotationX: 0,
        planetRotationY: 0,
        planetRotationZ: 0
    };

    dayMap = document.getElementById(SRC.DAY);
    dayTex = asTexture(dayMap);

    nightMap = document.getElementById(SRC.NIGHT);
    nightTex = asTexture(nightMap);

    normalMap = document.getElementById(SRC.NORMAL);
    normalTex = asTexture(normalMap);

    specMap = document.getElementById(SRC.SPEC);
    specTex = asTexture(specMap);

    var loader = new THREE.FileLoader();
    loader.load('./src/planetShader.frag',
        (data) => {
            fragSrc = data;
            continueIfLoaded();
        }
    );

    loader.load('./src/planetShader.vert',
        (data) => {
            vertSrc = data;
            continueIfLoaded();
        }
    );

    function asTexture(image) {
        image.crossOrigin = "anonymous";
        var texture = new THREE.Texture(image);
        texture.minFilter = THREE.NearestFilter;

        image.onload = () =>{
            texture.needsUpdate = true; 
        };
        image.src = image.src;

        return texture;
    }

    function continueIfLoaded() {
        if (fragSrc && vertSrc) {
            init();
            setupDND(dayMap);
            setupDND(nightMap);
            setupDND(normalMap);
            setupDND(specMap);
            setupGui();
            animate();
        }
    }

    function init() {
        container = document.getElementById('container');
        camera = new THREE.PerspectiveCamera(55, window.innerWidth / window.innerHeight, 0.01, 20000);
        camera.position.set(0, 0, 10);
        scene = new THREE.Scene();
        scene.background = new THREE.Color(0, 0, 0);
        var geometry = new THREE.PlaneBufferGeometry(10, 10);

        uniforms = {
            time: { value: 1.0 },
            antialias: {},
            planetRotationSpeed: {},
            planetSize: {},
            auraSize: {},
            planetTexture: { value: dayTex },
            nightTexture: { value: nightTex },
            normalTexture: { value: normalTex },
            specTexture: { value: specTex },
            lightPos: {},
            lightColor: {},
            auraColor: {},
            ambientLightColor: {},
            rotation: {}
        };

        updateUniforms();

        var material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertSrc,
            fragmentShader: fragSrc,
            defines: {
                USE_NORMAL: true,
                USE_SPEC: true,
                USE_NIGHT: true
            },
            side: THREE.DoubleSide,
            transparent: true,
        });

        mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        renderer = new THREE.WebGLRenderer({precision: "mediump"});
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.mouseButtons.ORBIT = THREE.MOUSE.RIGHT;
        controls.mouseButtons.PAN = THREE.MOUSE.LEFT;

        onWindowResize();
        window.addEventListener('resize', onWindowResize, false);
    }

    function setupGui() {
        var gui = new dat.GUI();
        var current;

        current = gui.addFolder("Color");
        current.addColor(guiData, "lightColor").name("Light").onChange(updateUniforms);
        current.addColor(guiData, "ambientLightColor").name("Ambient").onChange(updateUniforms);
        current.addColor(guiData, "auraColor").name("Aura").onChange(updateUniforms);

        current = gui.addFolder("Light Position");
        current.add(guiData, "lightPosX", -1.0, 1, 0.001).name("X").onChange(updateUniforms);
        current.add(guiData, "lightPosY", -1.0, 1, 0.001).name("Y").onChange(updateUniforms);
        current.add(guiData, "lightPosZ", -1.0, 1, 0.001).name("Z").onChange(updateUniforms);

        current = gui.addFolder("Axis Rotation");
        current.add(guiData, "planetRotationX", -180, 180, 1).name("X").onChange(updateUniforms);
        current.add(guiData, "planetRotationY", -180, 180, 1).name("Y").onChange(updateUniforms);
        current.add(guiData, "planetRotationZ", -180, 180, 1).name("Z").onChange(updateUniforms);

        current = gui.addFolder("Misc control");
        current.add(guiData, "auraSize", 0.0, 1, 0.001).name("Aura Size").onChange(updateUniforms);
        current.add(guiData, "planetRotationSpeed", 0.0, 0.5, 0.001).name("Rotation Speed").onChange(updateUniforms);
        current.add(guiData, "antialias", 0.5, 1, 0.001).name("Feathering").onChange(updateUniforms);
    }

    function animate(timestamp) {
        requestAnimationFrame(animate);
        uniforms.time.value = timestamp / 1000;
        renderer.render(scene, camera);
    }

    function updateUniforms() {
        uniforms.antialias.value = guiData.antialias;
        uniforms.planetRotationSpeed.value = -guiData.planetRotationSpeed;
        uniforms.planetSize.value = guiData.planetSize;
        uniforms.auraSize.value = guiData.auraSize;
        uniforms.lightPos.value = new THREE.Vector3(guiData.lightPosX, guiData.lightPosY, guiData.lightPosZ);
        uniforms.lightColor.value = [guiData.lightColor[0] / 255, guiData.lightColor[1] / 255, guiData.lightColor[2] / 255];
        uniforms.auraColor.value = [guiData.auraColor[0] / 255, guiData.auraColor[1] / 255, guiData.auraColor[2] / 255];
        uniforms.ambientLightColor.value = [guiData.ambientLightColor[0] / 255, guiData.ambientLightColor[1] / 255, guiData.ambientLightColor[2] / 255];
        uniforms.rotation.value = rotate(guiData.planetRotationX, guiData.planetRotationY, guiData.planetRotationZ);
    }

    function setupDND(image) {
        image.addEventListener('dragover', handleDragOver, false);
        image.addEventListener('drop', handleFileSelect(image), false);
    }

    function onWindowResize(event) {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    //https://www.html5rocks.com/en/tutorials/cors/
    function createCORSRequest(method, url) {
        var xhr = new XMLHttpRequest();
        if ("withCredentials" in xhr) {
        
            // Check if the XMLHttpRequest object has a "withCredentials" property.
            // "withCredentials" only exists on XMLHTTPRequest2 objects.
            xhr.open(method, url, true);
        
        } else if (typeof XDomainRequest != "undefined") {
        
            // Otherwise, check if XDomainRequest.
            // XDomainRequest only exists in IE, and is IE's way of making CORS requests.
            xhr = new XDomainRequest();
            xhr.open(method, url);
        
        } else {
        
            // Otherwise, CORS is not supported by the browser.
            xhr = null;
        
        }
        return xhr;
    }

    function handleFileSelect(image) {
        var defaultImage = image.src;
        return (evt) => {
            evt.stopPropagation();
            evt.preventDefault();
            
            var url = evt.dataTransfer.getData('text/uri-list');
            if (url) {
                var xhr = createCORSRequest('GET', url);
                xhr.onload = function() {
                    image.src = url;
                };
                
                xhr.onerror = function() {
                    console.log('There was an error!');
                    alert("Image Source does not support CORS.\nTry downloading the image, or uploading to imgur first");
                };
                xhr.send();
            } else {
                var files = evt.dataTransfer.files;

                var reader = new FileReader();
                reader.onload = function (e) {
                    image.src = e.target.result;
                };

                for (var i = 0, f; f = files[i]; i++) {
                    if (f.type.match(`image.*`)) {
                        reader.readAsDataURL(f);
                    } else {
                        oldImage = null;
                        image.src = defaultImage;
                    }
                }
            }
        }
    }


    function handleDragOver(evt) {
        evt.stopPropagation();
        evt.preventDefault();
        evt.dataTransfer.dropEffect = 'copy';
    }

    function rotate(x, y, z) {
        var DEG_RAD = Math.PI / 180;

        var rx = x * DEG_RAD;
        var ry = y * DEG_RAD;
        var rz = z * DEG_RAD;

        var sx = Math.sin(rx);
        var cx = Math.cos(rx);

        var sy = Math.sin(ry);
        var cy = Math.cos(ry);

        var sz = Math.sin(rz);
        var cz = Math.cos(rz);

        var rot = [];

        rot[0] = cy * cz;
        rot[1] = cy * sz;
        rot[2] = -sy;
        rot[3] = (sx * sy * cz) + (cx * -sz);
        rot[4] = (sx * sy * sz) + (cx * cz);
        rot[5] = sx * cy;
        rot[6] = (cx * sy * cz) + (-sx * -sz);
        rot[7] = (cx * sy * sz) + (-sx * cz);
        rot[8] = cx * cy;

        return rot;
    }
});