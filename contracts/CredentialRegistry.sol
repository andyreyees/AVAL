// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title Registro de títulos y certificaciones
/// @notice Almacena los hashes de los documentos y administra las instituciones autorizadas.
contract CredentialRegistry {

    // Estados posibles de una institución dentro del sistema.
    enum Status { None, Pending, Active, Rejected }

    // Información registrada de cada institución.
    struct Institution {
        Status status;
        string name;
        string domain;
        uint64 updatedAt;
    }

    // Información asociada a cada título o certificación.
    struct Credential {
        address issuer;
        uint64 issuedAt;
        bool revoked;
        string kind;
    }

    // Información devuelta al verificar un documento.
    struct Result {
        bool exists;
        bool revoked;
        bool issuerActive;
        address issuer;
        string issuerName;
        string issuerDomain;
        uint64 issuedAt;
        string kind;
    }

    // Dirección del administrador del contrato.
    address public owner;

    // Lista de billeteras que han solicitado acceso como instituciones.
    address[] public institutionList;

    // Relaciona una billetera con la información de su institución.
    mapping(address => Institution) private inst;

    // Relaciona el hash de un documento con la información de su título.
    mapping(bytes32 => Credential) private creds;

    // Eventos utilizados para registrar las principales acciones del sistema.
    event AccessRequested(address indexed wallet, string name, string domain);
    event Reviewed(address indexed wallet, bool approved);
    event Suspended(address indexed wallet);
    event Issued(bytes32 indexed docHash, address indexed issuer, string kind);
    event Revoked(bytes32 indexed docHash, address indexed issuer);

    // Permite ejecutar una función únicamente al administrador.
    modifier onlyOwner() {
        require(msg.sender == owner, "Solo el administrador");
        _;
    }

    // Permite ejecutar una función únicamente a instituciones activas.
    modifier onlyActive() {
        require(
            inst[msg.sender].status == Status.Active,
            "Institucion no autorizada"
        );
        _;
    }

    // El creador del contrato se establece como administrador.
    constructor() {
        owner = msg.sender;
    }

    // Permite a una institución solicitar acceso al sistema.
    function requestAccess(string calldata name, string calldata domain) external {
        Institution storage i = inst[msg.sender];

        require(
            i.status == Status.None || i.status == Status.Rejected,
            "Solicitud ya existe"
        );

        require(
            bytes(name).length > 0 && bytes(domain).length > 0,
            "Nombre y dominio requeridos"
        );

        if (i.status == Status.None) {
            institutionList.push(msg.sender);
        }

        inst[msg.sender] = Institution(
            Status.Pending,
            name,
            domain,
            uint64(block.timestamp)
        );

        emit AccessRequested(msg.sender, name, domain);
    }

    // Permite al administrador aprobar o rechazar una solicitud.
    function review(address wallet, bool approved) external onlyOwner {
        Institution storage i = inst[wallet];

        require(
            i.status == Status.Pending,
            "No hay solicitud pendiente"
        );

        i.status = approved ? Status.Active : Status.Rejected;
        i.updatedAt = uint64(block.timestamp);

        emit Reviewed(wallet, approved);
    }

    // Suspende una institución que actualmente se encuentra activa.
    function suspend(address wallet) external onlyOwner {
        require(
            inst[wallet].status == Status.Active,
            "No esta activa"
        );

        inst[wallet].status = Status.Rejected;

        emit Suspended(wallet);
    }

    // Registra un nuevo título utilizando el hash del documento.
    function issue(bytes32 docHash, string calldata kind) public onlyActive {
        require(
            creds[docHash].issuedAt == 0,
            "Ya emitido"
        );

        creds[docHash] = Credential(
            msg.sender,
            uint64(block.timestamp),
            false,
            kind
        );

        emit Issued(docHash, msg.sender, kind);
    }

    // Permite emitir varios títulos en una sola transacción.
    function issueBatch(
        bytes32[] calldata hashes,
        string calldata kind
    ) external onlyActive {
        for (uint256 i = 0; i < hashes.length; i++) {
            issue(hashes[i], kind);
        }
    }

    // Permite revocar un título únicamente a la institución que lo emitió.
    function revoke(bytes32 docHash) external {
        Credential storage c = creds[docHash];

        require(c.issuedAt != 0, "No existe");
        require(c.issuer == msg.sender, "Solo quien emitio");
        require(!c.revoked, "Ya revocado");

        c.revoked = true;

        emit Revoked(docHash, msg.sender);
    }

    // Consulta la información y el estado de un título.
    function verify(bytes32 docHash)
        external
        view
        returns (Result memory)
    {
        Credential memory c = creds[docHash];
        Institution memory i = inst[c.issuer];

        return Result(
            c.issuedAt != 0,
            c.revoked,
            i.status == Status.Active,
            c.issuer,
            i.name,
            i.domain,
            c.issuedAt,
            c.kind
        );
    }

    // Obtiene la información registrada de una institución.
    function getInstitution(address wallet)
        external
        view
        returns (Institution memory)
    {
        return inst[wallet];
    }

    // Devuelve la cantidad de instituciones registradas.
    function institutionCount()
        external
        view
        returns (uint256)
    {
        return institutionList.length;
    }
}
