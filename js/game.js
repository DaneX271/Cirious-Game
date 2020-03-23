let game = ( function () {

    let scene, camera, renderer, dirLight, hemiLight, ground, cube, sphere, controls, raycaster, ball;

    let mouse = new THREE.Vector2( );
    let sphereAround = [ ];
    let pos = new THREE.Vector3( );
    let intersect = [ ];


    // function resolving problems when resizing the window
    let onWindowResize = function( ) {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix( );
        renderer.setSize( window.innerWidth, window.innerHeight );

    }

    // create our scene
    let initScene = function( ) {
        
        scene = new THREE.Scene;
        scene.background = new THREE.Color( ).setHSL( 0.6, 0, 1 );
        scene.fog = new THREE.Fog( scene.background, 1, 5000 );

    }

    // create the camera and set it up
    let initCamera = function( ) {

        camera = new THREE.PerspectiveCamera( 90, window.innerWidth / window.innerHeight, 1, 5000 );
        camera.position.y = 30;
        mouse.x = 0, mouse.y = 0;
        
        // camera movement 
        controls = new THREE.PointerLockControls( camera, document.body );

        raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


        // unlock the camera
        window.addEventListener( 'click', function ( ) {

            controls.lock();

        }, false );
        scene.add( controls.getObject() );


        // add an invisible sphere around the camera
        const sphereGeometry = new THREE.SphereGeometry( 20, 50, 50);
        const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
        const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.castShadow = false;
        sphere.receiveShadow = false;
        sphere.visible = false;
        sphere.position.y = 30;
        scene.add( sphere );
        sphereAround.push( sphere );

    }

    // create the render
    let initRender = function( ) {

        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;

        document.body.appendChild( renderer.domElement );

    }

    // create the light, add the shadows and the sky
    let initLights = function( ) {

        hemiLight = new THREE.HemisphereLight( 0xffffff, 0xffffff, 0.6 );
        hemiLight.color.setHSL( 0.6, 1, 0.6 );
        hemiLight.groundColor.setHSL( 0.095, 1, 0.75 );
        hemiLight.position.set( 0, 50, 0 );
        scene.add( hemiLight );

        dirLight = new THREE.DirectionalLight( 0xffffff, 1 );
        dirLight.color.setHSL( 0.1, 1, 0.95 );
        dirLight.position.set( - 1, 1.75, 1 );
        dirLight.position.multiplyScalar( 30 );
        scene.add( dirLight );

        dirLight.castShadow = true;

        dirLight.shadow.mapSize.width = 2048;
        dirLight.shadow.mapSize.height = 2048;

        const d = 200;

        dirLight.shadow.camera.left = - d;
        dirLight.shadow.camera.right = d;
        dirLight.shadow.camera.top = d;
        dirLight.shadow.camera.bottom = - d;

        dirLight.shadow.camera.far = 3500;
        dirLight.shadow.bias = - 0.0001;

        // create a sky dome 
        const vertexShader = document.getElementById( 'vertexShader' ).textContent;
        const fragmentShader = document.getElementById( 'fragmentShader' ).textContent;
        const uniforms = {
            "topColor": { value: new THREE.Color( 0x0077ff ) },
            "bottomColor": { value: new THREE.Color( 0xffffff ) },
            "offset": { value: 33 },
            "exponent": { value: 0.6 }
        };
        uniforms[ "topColor" ].value.copy( hemiLight.color );

        scene.fog.color.copy( uniforms[ "bottomColor" ].value );

        const skyGeo = new THREE.SphereBufferGeometry( 4000, 32, 15 );
        const skyMat = new THREE.ShaderMaterial( {
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        } );

        const sky = new THREE.Mesh( skyGeo, skyMat );
        scene.add( sky );

    }

    // create all the objects
    let initObjects = function( ) {

        // add a basketball
        const objLoader = new THREE.OBJLoader( );
        objLoader.setPath( '/modele 3d/basket_ball/' );
        const mtlLoader = new THREE.MTLLoader( );
        mtlLoader.setPath( '/modele 3d/basket_ball/' );

        new Promise( ( resolve ) => {

            mtlLoader.load( 'NBA_BASKETBALL.mtl', ( materials ) => {
                resolve( materials );
            })
        })
        .then( ( materials ) => {
            materials.preload( );
            objLoader.setMaterials( materials );
            objLoader.load( 'NBA_BASKETBALL.obj', ( object ) => {
                ball = object;
                scene.add( ball );
            })
        })

        // add a cube
        const cubeGeometry = new THREE.BoxGeometry( 2, 2, 2 );
        const cubeMaterial = new THREE.MeshLambertMaterial( { color: 0xFFCC00 } );
        cube = new THREE.Mesh( cubeGeometry, cubeMaterial );
        cube.position.set(
            20,
            50,
            -30
        );
        cube.castShadow = true;
        cube.receiveShadow = true;
        //scene.add( cube );


        const sphereGeometry = new THREE.SphereGeometry( 5, 30, 30 );
        const sphereMaterial = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
        sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
        sphere.position.set(
            15,
            15,
            -30
        );
        sphere.castShadow = true;
        sphere.receiveShadow = true;
        scene.add( sphere );

    }

    let init = function( ) {

        initScene( );
        initCamera( );

        window.addEventListener( 'resize', onWindowResize, false );

        initRender( );
        initLights( );        

        // add a ground
        const groundGeo = new THREE.PlaneBufferGeometry( 10000, 10000 );
        const groundMat = new THREE.MeshLambertMaterial( { color: 0xffffff } );
        groundMat.color.setHSL( 0.095, 1, 0.75 );
        ground = new THREE.Mesh( groundGeo, groundMat );
        ground.rotation.x = - Math.PI / 2;
        ground.receiveShadow = true;
        scene.add( ground );

        initObjects( );

    }

    let mooveCube = function( ) {

        raycaster.setFromCamera( mouse, camera );
        pos.copy( raycaster.ray.direction );
        pos.x = pos.x * 20;
        pos.y = pos.y * 20;
        pos.z = pos.z * 20;
        pos.add( raycaster.ray.origin );
        if (ball)
            ball.position.copy( pos );

    }

    let mooveShpere = function( ) {

        raycaster.setFromCamera( mouse, camera );
        raycaster.far = 1000;
        if( raycaster.ray.direction.y >= -0.05 )
            raycaster.ray.direction.y = -0.05;
        intersect = raycaster.intersectObject( ground );
        sphere.position.copy( intersect[0].point );

    }

    // game logic
    let update = function( ) {

        mooveCube( );
        mooveShpere( );

    }

    //draw render
    let render = function( ) {

        renderer.render( scene, camera );

    }

    // main loop
    let animate = function( ) {

        requestAnimationFrame( animate );

        render( );
        update( );

    }
    
    return {
        init: ( ) => init( ),
        animate: ( ) => animate( )
    }

}) ();