// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Registro de títulos. Solo guarda hashes. Las instituciones piden acceso y el administrador las aprueba.
contract CredentialRegistry {
    enum Status { None, Pending, Active, Rejected }
    struct Institution { Status status; string name; string domain; uint64 updatedAt; }
    struct Credential { address issuer; uint64 issuedAt; bool revoked; string kind; }
    struct Result { bool exists; bool revoked; bool issuerActive; address issuer; string issuerName; string issuerDomain; uint64 issuedAt; string kind; }

    address public owner;
    address[] public institutionList;
    mapping(address => Institution) private inst;
    mapping(bytes32 => Credential) private creds;

    event AccessRequested(address indexed wallet, string name, string domain);
    event Reviewed(address indexed wallet, bool approved);
    event Suspended(address indexed wallet);
    event Issued(bytes32 indexed docHash, address indexed issuer, string kind);
    event Revoked(bytes32 indexed docHash, address indexed issuer);

    modifier onlyOwner() { require(msg.sender == owner, "Solo el administrador"); _; }
    modifier onlyActive() { require(inst[msg.sender].status == Status.Active, "Institucion no autorizada"); _; }

    constructor() { owner = msg.sender; }

    function requestAccess(string calldata name, string calldata domain) external {
        Institution storage i = inst[msg.sender];
        require(i.status == Status.None || i.status == Status.Rejected, "Solicitud ya existe");
        require(bytes(name).length > 0 && bytes(domain).length > 0, "Nombre y dominio requeridos");
        if (i.status == Status.None) institutionList.push(msg.sender);
        inst[msg.sender] = Institution(Status.Pending, name, domain, uint64(block.timestamp));
        emit AccessRequested(msg.sender, name, domain);
    }

    function review(address wallet, bool approved) external onlyOwner {
        Institution storage i = inst[wallet];
        require(i.status == Status.Pending, "No hay solicitud pendiente");
        i.status = approved ? Status.Active : Status.Rejected;
        i.updatedAt = uint64(block.timestamp);
        emit Reviewed(wallet, approved);
    }

    function suspend(address wallet) external onlyOwner {
        require(inst[wallet].status == Status.Active, "No esta activa");
        inst[wallet].status = Status.Rejected;
        emit Suspended(wallet);
    }

    function issue(bytes32 docHash, string calldata kind) public onlyActive {
        require(creds[docHash].issuedAt == 0, "Ya emitido");
        creds[docHash] = Credential(msg.sender, uint64(block.timestamp), false, kind);
        emit Issued(docHash, msg.sender, kind);
    }

    function issueBatch(bytes32[] calldata hashes, string calldata kind) external onlyActive {
        for (uint256 i = 0; i < hashes.length; i++) issue(hashes[i], kind);
    }

    function revoke(bytes32 docHash) external {
        Credential storage c = creds[docHash];
        require(c.issuedAt != 0, "No existe");
        require(c.issuer == msg.sender, "Solo quien emitio");
        require(!c.revoked, "Ya revocado");
        c.revoked = true;
        emit Revoked(docHash, msg.sender);
    }

    function verify(bytes32 docHash) external view returns (Result memory) {
        Credential memory c = creds[docHash];
        Institution memory i = inst[c.issuer];
        return Result(c.issuedAt != 0, c.revoked, i.status == Status.Active, c.issuer, i.name, i.domain, c.issuedAt, c.kind);
    }

    function getInstitution(address wallet) external view returns (Institution memory) { return inst[wallet]; }
    function institutionCount() external view returns (uint256) { return institutionList.length; }
}
