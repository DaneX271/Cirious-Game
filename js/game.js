let game = ( function () {

    let scene, camera, renderer, dirlight, hemiLight, cube;

    let raycaster;
    let mouse = new THREE.Vector2( );
    let sphereAround = [ ];


    // function resolving problems when resizing the window
    let onWindowResize = function( ) {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix( );
        renderer.setSize( window.innerWidth, window.innerHeight );

    };

    let init = function( ) {

        // create our scene
        scene = new THREE.Scene;
        scene.background = new THREE.Color( ).setHSL( 0.6, 0, 1 );
        scene.fog = new THREE.Fog( scene.background, 1, 5000 );


        // create the camera
        camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 1, 5000 );
        camera.position.y = 30;
        mouse.x = 0, mouse.y = 0;

        window.addEventListener( 'resize', onWindowResize, false );


        //create the render
        renderer = new THREE.WebGLRenderer( { antialias: true } );
        renderer.setPixelRatio( window.devicePixelRatio );
        renderer.setSize( window.innerWidth, window.innerHeight );
        renderer.shadowMap.enabled = true;

        document.body.appendChild( renderer.domElement );


        // camera movement 
        controls = new THREE.PointerLockControls( camera, document.body );

        raycaster = new THREE.Raycaster( new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 10 );


        // unlock the camera
        window.addEventListener( 'click', function ( ) {

            controls.lock();

        }, false );

    }

    let animate = function( ) {


    }
    
    return {

        init( ) {

            init( );
            animate( );

        }

    }

}) ();